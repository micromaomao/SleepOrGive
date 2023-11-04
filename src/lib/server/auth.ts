import { error, type RequestEvent } from '@sveltejs/kit';
import { withDBClient, type Client as DBClient } from './db';
import { generateToken, strToHashBuf } from './secure_token';
import { authenticationBearer } from '$lib/validations';
import { TimezoneContext } from '$lib/TimezoneContext';
import type { AuthAttemptState } from '$lib/shared_types';

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
	req_evt: RequestEvent,
	initial_state: AuthAttemptState | null,
	db?: DBClient
): Promise<{
	ticket: string;
	hashed_ticket: Buffer;
}> {
	if (!db) {
		return await withDBClient((db) => startAuthAttempt(user_id, req_evt, db));
	}
	if (initial_state === null) {
		initial_state = {};
	}
	let [ticket, hashed_ticket] = await generateToken();
	await db.query({
		text: `
			insert into auth_attempts (hashed_ticket, user_id, state, ip_addr)
			values ($1, $2, $3, $4)`,
		values: [hashed_ticket, user_id, initial_state, req_evt.getClientAddress()]
	});
	return {
		ticket,
		hashed_ticket,
	};
}

export async function getAuthAttemptState(hashed_ticket: Buffer, db?: DBClient): Promise<AuthAttemptState> {
	if (!db) {
		return await withDBClient((db) => getAuthAttemptState(hashed_ticket, db));
	}
	let { rows }: { rows: any[] } = await db.query({
		text: `select state from auth_attempts where hashed_ticket = $1`,
		values: [hashed_ticket]
	});
	if (rows.length == 0) {
		throw error(404, 'Auth attempt not found');
	}
	return rows[0].state;
}

export async function updateAuthAttemptState(
	hashed_ticket: Buffer,
	old_state: AuthAttemptState,
	new_state: AuthAttemptState,
	db?: DBClient
): Promise<void> {
	if (!db) {
		return await withDBClient((db) => updateAuthAttemptState(hashed_ticket, old_state, new_state, db));
	}
	let { rows }: { rows: any[] } = await db.query({
		text: `update auth_attempts set state = $3 where hashed_ticket = $1 and state = $2 returning 1`,
		values: [hashed_ticket, old_state, new_state]
	});
	if (rows.length == 0) {
		throw error(500, 'Transient error - try again');
	}
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
		throw error(500, 'Transient error - try again');
	}
	let user_id = rows[0].user_id;
	let sess = await createSession(user_id, hashed_ticket, req_evt);
	return sess;
}
