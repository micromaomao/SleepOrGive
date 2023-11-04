import { withDBClient, type Client as DBClient } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import { RateLimit } from '$lib/server/db/rate_limit';
import { OutgoingMailPurpose, createOutgoingEmail } from '.';
import { Purpose as VerificationPurpose } from './EmailVerificationEmail.svelte';
import EmailVerificationEmail from './EmailVerificationEmail.svelte';
import { fetchUserBasicData } from '../user';
import { generateToken, strToHashBuf } from '../secure_token';
import { mustBeValidEmail, mustBeValidVerificationCode } from '$lib/validations';
import { EmailConfig } from './config';
import { randomBytes } from 'node:crypto';
import { nowMillis } from '$lib/time';

function rateLimitPerAddressAndPurpose1d(address: string, purpose: string) {
	return new RateLimit(
		`email:verification:peraddrandpurpose:1d:${address}:${purpose}`,
		5,
		60 * 60 * 12
	);
}
function rateLimitPerAddressAndPurpose1h(address: string, purpose: string) {
	return new RateLimit(`email:verification:peraddrandpurpose:1h:${address}:${purpose}`, 3, 60 * 60);
}

export async function createVerification(
	client_ticket: string,
	address: string,
	verification_purpose: VerificationPurpose,
	user_id: string | null = null,
	db_client: DBClient = null
) {
	if (!db_client) {
		return await withDBClient((db) =>
			createVerification(client_ticket, address, verification_purpose, user_id, db)
		);
	}
	if (strToHashBuf(client_ticket) === null) {
		throw error(400, 'Invalid client ticket');
	}
	mustBeValidEmail(address);
	let { rows }: { rows: any[] } = await db_client.query({
		text: 'select email, purpose from email_verification where client_ticket = $1',
		values: [client_ticket]
	});
	if (rows.length == 0) {
		let subject: string;
		switch (verification_purpose) {
			case VerificationPurpose.Login:
				subject = `${EmailConfig.APP_NAME} login verification`;
				break;
			case VerificationPurpose.SignUp:
				subject = `Verify your email to sign up for ${EmailConfig.APP_NAME}`;
				break;
		}
		let username: string | null = null;
		if (user_id) {
			let user_data = await fetchUserBasicData(user_id, db_client);
			username = user_data.username;
		}
		let [code_ticket, hashed_code_ticket] = await generateToken();
		let rl_response = await rateLimitPerAddressAndPurpose1h(address, verification_purpose).bump(
			db_client
		);
		if (!rl_response.success) {
			throw error(
				429,
				`This email has requested verification for too many times in one hour. Please wait another ${rl_response.reset_remaining_secs} seconds before trying again.`
			);
		}
		rl_response = await rateLimitPerAddressAndPurpose1d(address, verification_purpose).bump(
			db_client
		);
		if (!rl_response.success) {
			throw error(
				429,
				`This email has requested verification for too many times today. Please try again tomorrow or contact sleep@maowtm.org for help.`
			);
		}
		({ rows } = await db_client.query({
			text: `
        insert into email_verification (
          client_ticket,
          email,
          hashed_code_ticket,
          purpose
        ) values ($1, $2, $3, $4)
        on conflict (client_ticket) do nothing
        returning 1 as ok`,
			values: [client_ticket, address, hashed_code_ticket, verification_purpose]
		}));
		if (rows.length == 0) {
			throw error(500, 'Transient database error. Please try again later.');
		}
		await createOutgoingEmail(
			{
				address,
				user_id,
				purpose: OutgoingMailPurpose.Verification,
				subject,
				component: EmailVerificationEmail as any,
				props: {
					purpose: verification_purpose,
					username,
					verificationLink: `${EmailConfig.ORIGIN}/email-verification-code?code_ticket=${code_ticket}`
				}
			},
			db_client
		);
	} else {
		let row = rows[0];
		if (row.email !== address || row.purpose !== verification_purpose) {
			throw error(400, 'Invalid verification request - client ticket reused.');
		}
	}
}

export const MAX_TRIES = 5;
export const EXPIRY_TIME = 1000 * 60 * 60;

export async function generateCode(): Promise<string> {
	return new Promise((resolve, reject) => {
		randomBytes(4, (err, buf) => {
			if (err) {
				reject(err);
				return;
			}
			let code = buf.readUInt32BE(0) % 1e6;
			resolve(code.toString().padStart(6, '0'));
		});
	});
}

export async function acquireCode(code_ticket: string): Promise<string> {
	let hashed_code_ticket = strToHashBuf(code_ticket);
	if (!hashed_code_ticket) {
		throw error(400, 'Invalid code ticket.');
	}
	let new_code = await generateCode();
	return await withDBClient(async (db) => {
		let { rows }: { rows: any[] } = await db.query({
			text: `update email_verification set code = COALESCE(code, $1) where hashed_code_ticket = $2 returning code, time`,
			values: [new_code, hashed_code_ticket]
		});
		if (rows.length == 0) {
			throw error(404, 'Invalid code ticket.');
		}
		if (rows[0].time.getTime() + EXPIRY_TIME < nowMillis()) {
			throw error(404, {
				message: 'This code has expired',
				codeExpired: true
			});
		}
		return rows[0].code;
	});
}

export async function checkAndConsumesVerification(
	client_ticket: string,
	expected_code: string,
	expected_email: string,
	db_client: DBClient = null
) {
	if (!db_client) {
		return await withDBClient((db) =>
			checkAndConsumesVerification(client_ticket, expected_code, expected_email, db)
		);
	}
	mustBeValidVerificationCode(expected_code);
	mustBeValidEmail(expected_email);
	if (strToHashBuf(client_ticket) === null) {
		throw error(400, 'Invalid client ticket');
	}
	let ret_err = null;
	await db_client.query({
		text: 'begin transaction isolation level serializable'
	});
	try {
		let { rows }: { rows: any[] } = await db_client.query({
			text: `
        update email_verification set try_count = try_count + 1
          where client_ticket = $1
          returning code, email, try_count, time`,
			values: [client_ticket]
		});
		if (rows.length == 0) {
			ret_err = error(400, {
				message: 'Incorrect verification code.',
				requireNewCode: true
			});
		} else {
			let row = rows[0];
			if (row.time.getTime() + EXPIRY_TIME < nowMillis()) {
				ret_err = error(400, {
					message: 'Verification code expired. Please get another code.',
					requireNewCode: true
				});
			} else if (row.try_count >= MAX_TRIES) {
				ret_err = error(400, {
					message:
						'You have entered the code incorrectly too many times. Please check your email address and get another code.',
					requireNewCode: true
				});
			} else if (row.email !== expected_email) {
				ret_err = error(400, {
					message: 'Email does not match verification request.',
					requireNewCode: true
				});
			} else if (!row.code || row.code !== expected_code) {
				if (row.try_count == MAX_TRIES - 1) {
					ret_err = error(
						400,
						'Incorrect verification code. You have one last chance to enter the code correctly.'
					);
				} else {
					ret_err = error(400, 'Incorrect verification code.');
				}
			} else {
				await db_client.query({
					text: 'delete from email_verification where client_ticket = $1',
					values: [client_ticket]
				});
			}
		}
		await db_client.query({ text: 'commit' });
	} finally {
		db_client.query({
			text: 'rollback'
		});
	}
	if (ret_err) {
		throw ret_err;
	}
}
