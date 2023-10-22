import { checkSignupInfoConflict } from '$lib/server/user';
import { mustBeValidEmail } from '$lib/validations';
import { error } from '@sveltejs/kit';
import type { RequestEvent } from './$types';

export async function GET({ url }: RequestEvent): Promise<Response> {
	let email = url.searchParams.get('email');
	mustBeValidEmail(email);
	if (await checkSignupInfoConflict({ email })) {
		throw error(409, 'A user already exist with this email. Try logging in instead?');
	}
	return new Response('Available');
}
