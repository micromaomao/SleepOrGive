import { checkSignupInfoConflict } from '$lib/server/user';
import { mustBeValidUsername } from '$lib/validations';
import { error } from '@sveltejs/kit';
import type { RequestEvent } from './$types';

export async function GET({ url }: RequestEvent): Promise<Response> {
	let username = url.searchParams.get('username');
	mustBeValidUsername(username);
	if (await checkSignupInfoConflict({ username })) {
		throw error(409, 'Username already taken');
	}
	return new Response('Available');
}
