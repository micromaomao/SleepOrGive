import { checkUserInfoConflict } from '$lib/server/user';
import { mustBeValidUsername } from '$lib/validations';
import { error } from '@sveltejs/kit';
import type { RequestEvent } from './$types';

export async function GET({ url, locals }: RequestEvent): Promise<Response> {
	let username = url.searchParams.get('username');
	mustBeValidUsername(username);
	if (await checkUserInfoConflict({ username }, locals.user?.user_id)) {
		throw error(409, 'Username already taken');
	}
	return new Response('Available');
}
