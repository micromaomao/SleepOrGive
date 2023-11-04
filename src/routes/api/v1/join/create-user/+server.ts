import {
	mustBeValidCurrency,
	mustBeValidDonationAmount,
	mustBeValidEmail,
	mustBeValidNotificationTimeOffsets,
	mustBeValidUsername,
	mustBeValidVerificationCode,
	validateUserSettings
} from '$lib/validations';
import { error, json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import type { CreateUserAPIBody } from './types';
import { parseTime, stringifyTime } from '$lib/textutils';
import { checkAndConsumesVerification } from '$lib/server/email/verification';
import { withDBClient } from '$lib/server/db';
import { checkUserInfoConflict, createUser } from '$lib/server/user';
import { authSuccess, startAuthAttempt } from '$lib/server/auth';

export async function POST(evt: RequestEvent): Promise<Response> {
	let { request } = evt;
	let body: CreateUserAPIBody = await request.json();
	if (typeof body != 'object') {
		throw error(400, 'Invalid request body.');
	}
	if (typeof body.emailVerificationClientTicket != 'string') {
		throw error(400, 'Missing emailVerificationClientTicket.');
	}
	if (typeof body.emailVerificationCode != 'string') {
		throw error(400, 'Missing emailVerificationCode.');
	}
	mustBeValidVerificationCode(body.emailVerificationCode);
	if (typeof body.sleepTargetTime != 'string') {
		throw error(400, 'Missing sleepTargetTime.');
	}
	body.sleepTargetTime = stringifyTime(parseTime(body.sleepTargetTime));
	validateUserSettings(body);

	let r = await withDBClient(async (db) => {
		if (body.username && (await checkUserInfoConflict({ username: body.username }, null, db))) {
			throw error(409, 'A user already exists with this username.');
		}
		if (await checkUserInfoConflict({ email: body.email }, null, db)) {
			throw error(409, 'A user already exists with this email.');
		}
		await checkAndConsumesVerification(
			body.emailVerificationClientTicket,
			body.emailVerificationCode,
			body.email,
			db
		);

		let user_id = await createUser(body, db);
		let auth_state = { first_sign_up_auto_login: true };
		let auth_ticket = await startAuthAttempt(user_id, evt, auth_state, db);
		let session = await authSuccess(auth_ticket.hashed_ticket, auth_state, evt, db);

		return {
			userId: user_id,
			authToken: session.bearer
		};
	});

	return json(r);
}
