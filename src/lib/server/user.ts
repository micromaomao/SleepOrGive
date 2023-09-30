import { error } from '@sveltejs/kit';
import { withDBClient } from './db';
import { createHash } from 'crypto';
import type { UserData } from '$lib/shared_types';

export async function fetchUserData(
	user_id: string,
	include_history: boolean = false
): Promise<UserData> {
	return await withDBClient<UserData>(async (db) => {
		let { rows } = await db.query({
			text: 'select user_id, username from users where user_id = $1',
			values: [user_id]
		});
		if (rows.length == 0) {
			throw error(404, 'User not found');
		}
		let user = rows[0];
		return {
			...user,
			sleep_data: {
				currentYear: 2023,
				currentMonth: 8
			}
		};
	});
}

export async function isUserPublic(user_id: string): Promise<boolean> {
	return true;
}

export async function fetchUserAvatarUrl(user_id: string, size: number): Promise<string> {
	return await withDBClient(async (db) => {
		let { rows } = await db.query({
			text: 'select notification_email from users where user_id = $1',
			values: [user_id]
		});
		if (rows.length == 0) {
			throw error(404, 'User not found');
		}
		let email = rows[0].notification_email;
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
