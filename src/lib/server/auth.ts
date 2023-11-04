import { error, type RequestEvent } from '@sveltejs/kit';
import { withDBClient, type Client as DBClient } from './db';
import { generateToken, strToHashBuf } from './secure_token';
import { authenticationBearer } from '$lib/validations';
import { TimezoneContext } from '$lib/TimezoneContext';
import type { AuthAttemptState, UserAuthConfig } from '$lib/shared_types';
import { checkAndConsumesVerification, createVerification } from './email/verification';
import { Purpose } from './email/EmailVerificationEmail.svelte';

export interface AuthenticatedUserInfo {
	user_id: string;
	username: string | null;
	is_admin: boolean;
	primary_email: string | null;
	target: string | null;
	last_monthly_process_time: Date | null;

	is_public: boolean;
	timezone: TimezoneContext;
}

export async function checkAuthentication(
	req_evt: RequestEvent
): Promise<AuthenticatedUserInfo | null> {
	let auth_header = req_evt.request.headers.get('Authorization');
	let token = authenticationBearer(auth_header);
	if (!token) {
		return null;
	}
	let hashedToken = strToHashBuf(token);
	let { rows } = await withDBClient<{ rows: any[] }>((db) =>
		db.query({
			text: `select hashed_cookie, user_id from sessions where hashed_bearer = $1`,
			values: [hashedToken]
		})
	);
	if (rows.length == 0) {
		return null;
	}
	let sess = rows[0];
	if (sess.hashed_cookie) {
		let cookie = req_evt.cookies.get('session');
		if (typeof cookie != 'string') {
			return null;
		}
		let hashedCookie = strToHashBuf(cookie);
		if (!hashedCookie.equals(sess.hashed_cookie)) {
			return null;
		}
	}
	let user_id = sess.user_id;
	({ rows } = await withDBClient<{ rows: any[] }>((db) =>
		db.query({
			text: 'select * from users where user_id = $1',
			values: [user_id]
		})
	));
	if (rows.length == 0) {
		return null;
	}
	let user = rows[0];
	return {
		...user,
		is_public: !!user.is_public,
		timezone: TimezoneContext.fromZoneName(user.timezone) ?? TimezoneContext.fromZoneName('UTC')
	};
}

interface CreatedSession {
	bearer: string;
	cookie: string;
}

export async function createSession(
	user_id: string,
	granted_from: Buffer,
	req_evt?: RequestEvent
): Promise<CreatedSession> {
	let [bearer, bearerHash] = await generateToken();
	let [cookie, cookieHash] = await generateToken();
	await withDBClient((db) =>
		db.query({
			text: `insert into sessions (user_id, hashed_bearer, hashed_cookie, granted_from) values ($1, $2, $3, $4)`,
			values: [user_id, bearerHash, cookieHash, granted_from]
		})
	);
	if (req_evt) {
		req_evt.cookies.set('session', cookie, { path: '/', httpOnly: true });
	}
	return { bearer, cookie };
}

export async function logoutSession(req_evt: RequestEvent): Promise<void> {
	let auth_header = req_evt.request.headers.get('Authorization');
	let token = authenticationBearer(auth_header);
	if (!token) {
		throw error(400, 'Missing Authorization header');
	}
	let hashedToken = strToHashBuf(token);
	await withDBClient((db) =>
		db.query({
			text: 'delete from sessions where hashed_bearer = $1',
			values: [hashedToken]
		})
	);
	req_evt.cookies.delete('session');
}

export async function startAuthAttempt(
	user_id: string,
	hashed_ticket: Buffer,
	req_evt: RequestEvent,
	initial_state: AuthAttemptState | null,
	db?: DBClient
): Promise<void> {
	if (!db) {
		return await withDBClient((db) =>
			startAuthAttempt(user_id, hashed_ticket, req_evt, initial_state, db)
		);
	}
	if (initial_state === null) {
		initial_state = {};
	}
	await db.query({
		text: `
			insert into auth_attempts (hashed_ticket, user_id, state, ip_addr, started_at)
			values ($1, $2, $3, $4, now())
			on conflict (hashed_ticket)
				do update set user_id = $2, state = $3, ip_addr = $4, started_at = now()`,
		values: [hashed_ticket, user_id, initial_state, req_evt.getClientAddress()]
	});
}

export async function getAuthAttemptState(
	hashed_ticket: Buffer,
	db?: DBClient
): Promise<{
	state: AuthAttemptState;
	user_id: string;
}> {
	if (!db) {
		return await withDBClient((db) => getAuthAttemptState(hashed_ticket, db));
	}
	let { rows }: { rows: any[] } = await db.query({
		text: `select state, user_id from auth_attempts where hashed_ticket = $1`,
		values: [hashed_ticket]
	});
	if (rows.length == 0) {
		throw error(404, 'Auth attempt not found');
	}
	return rows[0];
}

export async function updateAuthAttemptState(
	hashed_ticket: Buffer,
	old_state: AuthAttemptState,
	new_state: AuthAttemptState,
	db?: DBClient
): Promise<void> {
	if (!db) {
		return await withDBClient((db) =>
			updateAuthAttemptState(hashed_ticket, old_state, new_state, db)
		);
	}
	let { rows }: { rows: any[] } = await db.query({
		text: `update auth_attempts set state = $3 where hashed_ticket = $1 and state = $2 returning 1`,
		values: [hashed_ticket, old_state, new_state]
	});
	if (rows.length == 0) {
		throw error(500, 'Transient error - try again');
	}
}

export async function lookupEmail(email: string, db?: DBClient): Promise<string | null> {
	if (!db) {
		return await withDBClient((db) => lookupEmail(email, db));
	}
	let { rows }: { rows: any[] } = await db.query({
		text: `select user_id from users where primary_email = $1`,
		values: [email]
	});
	if (rows.length == 0) {
		throw error(404, 'No user with this email');
	}
	return rows[0].user_id;
}

export async function authStateStartEmail(
	attempt_ticket_hash: Buffer,
	db?: DBClient
): Promise<AuthAttemptState> {
	if (!db) {
		return await withDBClient((db) => authStateStartEmail(attempt_ticket_hash, db));
	}

	let { state, user_id } = await getAuthAttemptState(attempt_ticket_hash, db);
	let auth_info = await getUserAuthInfo(user_id, db);
	if (!auth_info.primaryEmail) {
		throw error(400, 'Cannot use email verification for this user');
	}
	if (state.email_verification_client_ticket) {
		return;
	}

	let [ticket, _] = await generateToken();
	await createVerification(ticket, auth_info.primaryEmail, Purpose.Login, user_id, db);
	let new_state: AuthAttemptState = {
		...state,
		email_verification_client_ticket: ticket,
		email_verification_solved: false
	};
	await updateAuthAttemptState(attempt_ticket_hash, state, new_state, db);
	return new_state;
}

export async function authAttemptSolveEmail(
	attempt_ticket_hash: Buffer,
	code: string,
	db?: DBClient
): Promise<AuthAttemptState> {
	if (!db) {
		return await withDBClient((db) => authAttemptSolveEmail(attempt_ticket_hash, code, db));
	}
	let { state, user_id } = await getAuthAttemptState(attempt_ticket_hash, db);
	let auth_info = await getUserAuthInfo(user_id, db);
	if (!auth_info.primaryEmail) {
		throw error(400, 'Cannot use email verification for this user');
	}
	let email_tiekct = state.email_verification_client_ticket;
	if (!email_tiekct) {
		throw error(400, 'Email verification not started');
	}
	try {
		await checkAndConsumesVerification(email_tiekct, code, auth_info.primaryEmail, db);
	} catch (e) {
		if (e.body?.requireNewCode) {
			await updateAuthAttemptState(attempt_ticket_hash, state, {
				...state,
				email_verification_client_ticket: null,
				email_verification_solved: false
			});
		}
		throw e;
	}
	let new_state = {
		...state,
		email_verification_solved: true
	};
	await updateAuthAttemptState(attempt_ticket_hash, state, new_state);
	return new_state;
}

export function isAuthStateSuccessful(auth_info: AuthInfo, state: AuthAttemptState): boolean {
	if (state.first_sign_up_auto_login) {
		return true;
	}
	if (
		auth_info.primaryEmail &&
		state.email_verification_client_ticket &&
		state.email_verification_solved
	) {
		return true;
	}
	return false;
}

export async function authSuccess(
	hashed_ticket: Buffer,
	curr_state: AuthAttemptState,
	req_evt: RequestEvent | null,
	db?: DBClient
): Promise<CreatedSession> {
	if (!db) {
		return await withDBClient((db) => authSuccess(hashed_ticket, curr_state, db));
	}
	let { rows }: { rows: any[] } = await db.query({
		text: `update auth_attempts set success_at = now() where hashed_ticket = $1 and state = $2 and success_at is null returning user_id`,
		values: [hashed_ticket, curr_state]
	});
	if (rows.length == 0) {
		throw error(409, 'Session already issued');
	}
	let user_id = rows[0].user_id;
	let sess = await createSession(user_id, hashed_ticket, req_evt);
	return sess;
}

export interface AuthInfo {
	authConfig: UserAuthConfig;
	primaryEmail: string | null;
}

export async function getUserAuthInfo(user_id: string, db?: DBClient): Promise<AuthInfo> {
	if (!db) {
		return await withDBClient((db) => getUserAuthInfo(user_id, db));
	}

	return await withDBClient(async (db) => {
		let { rows }: { rows: any[] } = await db.query({
			text: 'select primary_email, authentication_config from users where user_id = $1',
			values: [user_id]
		});
		if (rows.length == 0) {
			throw error(404, 'User not found');
		}
		let row = rows[0];
		return {
			authConfig: row.authentication_config,
			primaryEmail: row.primary_email
		};
	});
}
