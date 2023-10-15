import { error, type RequestEvent } from '@sveltejs/kit';
import { withDBClient } from './db';
import { generateToken, strToHashBuf } from './secure_token';
import { authenticationBearer } from '$lib/validations';
import { TimezoneContext } from '$lib/TimezoneContext';

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

export async function createSession(user_id: string): Promise<CreatedSession> {
	let [bearer, bearerHash] = await generateToken();
	let [cookie, cookieHash] = await generateToken();
	await withDBClient((db) =>
		db.query({
			text: `insert into sessions (user_id, hashed_bearer, hashed_cookie) values ($1, $2, $3)`,
			values: [user_id, bearerHash, cookieHash]
		})
	);
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
