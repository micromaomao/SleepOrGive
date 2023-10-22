import { checkUserInfoConflict } from '$lib/server/user';
import { mustBeValidEmail } from '$lib/validations';
import { error } from '@sveltejs/kit';
import type { RequestEvent } from './$types';

export async function GET({ url, locals }: RequestEvent): Promise<Response> {
	let email = url.searchParams.get('email');
	mustBeValidEmail(email);
	if (await checkUserInfoConflict({ email }, locals.user?.user_id)) {
		throw error(409, 'A user already exist with this email. Try logging in instead?');
	}
	return new Response('Available');
}
