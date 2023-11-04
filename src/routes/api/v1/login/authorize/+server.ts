import { error, json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { withDBClient } from '$lib/server/db';
import {
	authAttemptSolveEmail,
	authStateStartEmail,
	authSuccess,
	createSession,
	getAuthAttemptState,
	getUserAuthInfo,
	isAuthStateSuccessful,
	lookupEmail,
	startAuthAttempt
} from '$lib/server/auth';
import { mustBeUlid, mustBeValidEmail, mustBeValidVerificationCode } from '$lib/validations';
import { strToHashBuf } from '$lib/server/secure_token';
import { fetchUserBasicData } from '$lib/server/user';
import type { AuthAttemptState } from '$lib/shared_types';

export async function POST(req_evt: RequestEvent) {
	let { request } = req_evt;
	let body = await request.json();
	if (typeof body != 'object') {
		throw error(400, 'Invalid request body.');
	}
	if (typeof body.ticket != 'string') {
		throw error(400, 'Missing ticket.');
	}
	let hashed_ticket = strToHashBuf(body.ticket);
	if (!hashed_ticket) {
		throw error(400, 'Invalid ticket.');
	}
	return await withDBClient(async (db) => {
		let user_id: string, state: AuthAttemptState;
		try {
			({ user_id, state } = await getAuthAttemptState(hashed_ticket, db));
		} catch (e) {
			if (e.status == 404) {
				// Need to start a new auth attempt
				if (typeof body.email == 'string') {
					mustBeValidEmail(body.email);
					user_id = await lookupEmail(body.email, db);
				} else {
					throw error(400, 'Missing email.');
				}
				state = {};
				await startAuthAttempt(user_id, hashed_ticket, req_evt, state, db);
			} else {
				throw e;
			}
		}
		let auth_info = await getUserAuthInfo(user_id, db);
		if (!isAuthStateSuccessful(auth_info, state)) {
			if (body.email === auth_info.primaryEmail && !state.email_verification_client_ticket) {
				state = await authStateStartEmail(hashed_ticket, db);
				return json({
					emailSent: true,
					message: 'Email verification sent'
				});
			}
			if (
				state.email_verification_client_ticket &&
				!state.email_verification_solved &&
				typeof body.code == 'string'
			) {
				mustBeValidVerificationCode(body.code);
				state = await authAttemptSolveEmail(hashed_ticket, body.code, db);
			}
		}
		if (isAuthStateSuccessful(auth_info, state)) {
			let session = await authSuccess(hashed_ticket, state, req_evt, db);
			let user_info = await fetchUserBasicData(user_id, db);
			return json({
				...user_info,
				authToken: session.bearer
			});
		}
		throw error(400, 'Insufficient information to authenticate.');
	});
}
