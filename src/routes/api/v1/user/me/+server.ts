import { error, json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';

export async function GET({ locals }: RequestEvent) {
	if (!locals.user) {
		throw error(401, 'Not logged in');
	}

	let user = locals.user;

	return json({
		user_id: user.user_id,
		username: user.username,
		timezone: user.timezone
	});
}
