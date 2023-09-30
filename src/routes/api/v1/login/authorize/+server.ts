import { error, json, type RequestEvent } from '@sveltejs/kit';
import { withDBClient } from '$lib/server/db';
import { createSession } from '$lib/server/auth';
import { mustBeUlid } from '$lib/validations';

export async function POST({ request, url, cookies }: RequestEvent) {
	if (process.env.NODE_ENV == 'development') {
		// TODO: remove
		let user_id = url.searchParams.get('user_id');
		mustBeUlid(user_id, 'user_id');
		let { bearer, cookie } = await createSession(user_id);
		cookies.set('session', cookie, { path: '/' });
		return json({ bearer });
	}
	throw error(501, 'Not implemented');
}
