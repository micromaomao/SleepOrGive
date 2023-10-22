import { error } from '@sveltejs/kit';
import { withDBClient, type Client as DBClient } from './db';
import { createHash } from 'crypto';
import type { BasicUserData, UserData } from '$lib/shared_types';
import { luxonNow } from '$lib/time';
import { TimezoneContext } from '$lib/TimezoneContext';

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
	query: { username: string } | { email: string },
	currentUserId: string | null = null
): Promise<boolean> {
	let query_text, values;
	if ('username' in query) {
		query_text = 'select 1 from users where lower(username) = lower($1) and user_id != $2';
		values = [query.username, currentUserId];
	} else if ('email' in query) {
		query_text = 'select 1 from users where lower(primary_email) = lower($1) and user_id != $2';
		values = [query.email, currentUserId];
	} else {
		throw new Error('Invalid query');
	}
	let { rows }: { rows: any[] } = await withDBClient((db) =>
		db.query({ text: query_text, values })
	);
	return rows.length > 0;
}
