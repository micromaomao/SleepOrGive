import { error } from '@sveltejs/kit';
import { withDBClient, type Client as DBClient } from './db';
import { createHash } from 'crypto';
import type { BasicUserData, UserData, UserSettings } from '$lib/shared_types';
import { luxonNow } from '$lib/time';
import { TimezoneContext } from '$lib/TimezoneContext';
import type { CreateUserAPIBody } from '../../routes/api/v1/join/create-user/types';
import {
	mustBeValidCurrency,
	mustBeValidDonationAmount,
	mustBeValidNotificationTimeOffsets,
	mustBeValidTimezone,
	mustBeValidUsername
} from '$lib/validations';
import { parseTime, stringifyTime } from '$lib/textutils';

export async function fetchUserBasicData(user_id: string, db: DBClient): Promise<BasicUserData> {
	let { rows } = await db.query({
		text: 'select user_id, username, timezone from users where user_id = $1',
		values: [user_id]
	});
	if (rows.length == 0) {
		throw error(404, 'User not found');
	}
	let user = rows[0];
	return user;
}

export async function fetchUserData(
	user_id: string,
	include_older_history: boolean = false
): Promise<UserData> {
	return await withDBClient<UserData>(async (db) => {
		let user = await fetchUserBasicData(user_id, db);
		let now = luxonNow(TimezoneContext.fromZoneName(user.timezone));
		return {
			...user,
			sleep_data: {
				currentYear: now.year,
				currentMonth: now.month
			}
		};
	});
}

export async function isUserPublic(user_id: string): Promise<boolean> {
	let { rows }: { rows: any[] } = await withDBClient((db) =>
		db.query({
			text: 'select is_public from users where user_id = $1',
			values: [user_id]
		})
	);
	if (rows.length == 0) {
		throw error(404, 'User not found');
	}
	return rows[0].is_public == true;
}

export async function fetchUserAvatarUrl(user_id: string, size: number): Promise<string> {
	return await withDBClient(async (db) => {
		let { rows } = await db.query({
			text: 'select primary_email from users where user_id = $1',
			values: [user_id]
		});
		if (rows.length == 0) {
			throw error(404, 'User not found');
		}
		let email = rows[0].primary_email;
		let email_hash = '00000000000000000000000000000000';
		if (email) {
			let hash = createHash('md5', { encoding: 'utf8' });
			hash.update(email.trim().toLowerCase());
			email_hash = hash.digest('hex');
		}
		let gravatar_url = `https://www.gravatar.com/avatar/${email_hash}?s=${size}&d=identicon`;
		return gravatar_url;
	});
}

export async function usernameToId(username: string): Promise<string> {
	let { rows }: { rows: any[] } = await withDBClient((db) =>
		db.query({
			text: 'select user_id from users where username = $1',
			values: [username]
		})
	);
	if (rows.length == 0) {
		throw error(404, 'User not found');
	}
	return rows[0].user_id;
}

/**
 * @returns true if there is a conflict
 */
export async function checkUserInfoConflict(
	query: { username?: string; email?: string },
	currentUserId: string | null = null,
	db?: DBClient
): Promise<boolean> {
	if (!db) {
		return await withDBClient((db) => checkUserInfoConflict(query, currentUserId, db));
	}
	if ('username' in query && 'email' in query) {
		// Can I even use the same db instance concurrently?
		// return (await Promise.all([
		// 	checkUserInfoConflict({ username: query.username }, currentUserId, db),
		// 	checkUserInfoConflict({ email: query.email }, currentUserId, db)
		// ])).some((x) => x);
		throw new Error('Multiple query fields not supported');
	}
	let query_text: string, values: (string | null)[];
	if ('username' in query) {
		query_text =
			'select 1 from users where lower(username) = lower($1) and ($2::text is null or user_id != $2)';
		values = [query.username, currentUserId];
	} else if ('email' in query) {
		query_text =
			'select 1 from users where lower(primary_email) = lower($1) and ($2::text is null or user_id != $2)';
		values = [query.email, currentUserId];
	} else {
		throw new Error('Invalid query');
	}
	let { rows }: { rows: any[] } = await db.query({ text: query_text, values });
	return rows.length > 0;
}

/**
 * Caller expected to validate `info`, check for conflicts etc
 */
export async function createUser(info: UserSettings, db: DBClient): Promise<string> {
	let { rows }: { rows: any[] } = await db.query({
		text: `
			insert into users (
				username,
				primary_email,
				timezone,
				target,
				currency,
				donation_per_minute,
				is_public,
				sleep_notification_times_offsets
			) values ($1, $2, $3, $4, $5, $6, $7, $8)
			returning user_id`,
		values: [
			info.username,
			info.email,
			info.timezone,
			info.sleepTargetTime,
			info.currency,
			info.donationAmount,
			info.profileIsPublic,
			info.sleepNotificationTimeOffsets.map((x) => `${x} minute`)
		]
	});
	return rows[0].user_id;
}

export async function getUserSettings(user_id: string, db?: DBClient): Promise<UserSettings> {
	if (!db) {
		return await withDBClient((db) => getUserSettings(user_id, db));
	}
	let { rows }: { rows: any[] } = await db.query({
		text: `
			select
				username,
				primary_email as email,
				timezone,
				target::text as "sleepTargetTime",
				currency,
				donation_per_minute::text as "donationAmount",
				is_public as "profileIsPublic",
				array(
					select round(extract(epoch from x)/60)::int
						from unnest(sleep_notification_times_offsets) as x
				) as "sleepNotificationTimeOffsets"
			from users where user_id = $1`,
		values: [user_id]
	});
	if (rows.length == 0) {
		throw error(404, 'User not found');
	}
	let user = rows[0];
	return user;
}

export async function updateUserSettings(
	user_id: string,
	updates: Partial<UserSettings>,
	db?: DBClient
): Promise<void> {
	if (!db) {
		return await withDBClient((db) => updateUserSettings(user_id, updates, db));
	}
	let old_values = await getUserSettings(user_id, db);
	let query_sets: string[] = [];
	let values: any[] = [];
	for (let [key, value] of Object.entries(updates)) {
		if (key == 'username') {
			if (value === old_values.username) {
				continue;
			}
			if (value !== null) {
				if (typeof value !== 'string') {
					throw error(400, 'Invalid username.');
				}
				mustBeValidUsername(value);
				if (await checkUserInfoConflict({ username: value }, user_id, db)) {
					throw error(409, 'A user already exists with this username.');
				}
			} else {
				value = null;
			}
			query_sets.push(`username = $${values.length + 1}`);
			values.push(value);
		} else if (key == 'email') {
			throw error(400, 'Email cannot be changed with this endpoint.');
		} else if (key == 'timezone') {
			if (typeof value !== 'string') {
				throw error(400, 'Invalid timezone.');
			}
			mustBeValidTimezone(value);
			query_sets.push(`timezone = $${values.length + 1}`);
			values.push(value);
		} else if (key == 'sleepTargetTime') {
			if (typeof value !== 'string') {
				throw error(400, 'Invalid sleepTargetTime.');
			}
			let parsedTime = parseTime(value);
			query_sets.push(`target = $${values.length + 1}`);
			values.push(stringifyTime(parsedTime));
		} else if (key == 'currency') {
			if (typeof value !== 'string') {
				throw error(400, 'Invalid currency.');
			}
			mustBeValidCurrency(value);
			query_sets.push(`currency = $${values.length + 1}`);
			values.push(value);
		} else if (key == 'donationAmount') {
			if (typeof value !== 'string') {
				throw error(400, 'Invalid donationAmount.');
			}
			mustBeValidDonationAmount(value);
			query_sets.push(`donation_per_minute = $${values.length + 1}`);
			values.push(value);
		} else if (key == 'profileIsPublic') {
			if (typeof value !== 'boolean') {
				throw error(400, 'Invalid profileIsPublic.');
			}
			query_sets.push(`is_public = $${values.length + 1}`);
			values.push(value);
		} else if (key == 'sleepNotificationTimeOffsets') {
			if (!Array.isArray(value)) {
				throw error(400, 'Invalid sleepNotificationTimeOffsets.');
			}
			mustBeValidNotificationTimeOffsets(value);
			query_sets.push(`sleep_notification_times_offsets = $${values.length + 1}`);
			values.push(value.map((x) => `${x} minute`));
		} else {
			throw error(400, `Unknown field ${key}`);
		}
	}
	if (query_sets.length == 0) {
		return;
	}
	await db.query({
		text: `update users set ${query_sets.join(', ')} where user_id = $${values.length + 1}`,
		values: [...values, user_id]
	});
}
