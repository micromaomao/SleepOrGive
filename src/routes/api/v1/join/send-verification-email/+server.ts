import { error } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { mustBeValidEmail } from '$lib/validations';
import { checkUserInfoConflict } from '$lib/server/user';
import { createVerification } from '$lib/server/email/verification';
import { Purpose } from '$lib/server/email/EmailVerificationEmail.svelte';

export async function POST({ request }: RequestEvent): Promise<Response> {
	let json = await request.json();
	mustBeValidEmail(json.email);
	if (typeof json.ticket != 'string') {
		throw error(400, 'Missing ticket.');
	}
	if (await checkUserInfoConflict({ email: json.email })) {
		throw error(409, 'A user already exist with this email.');
	}
	await createVerification(json.ticket, json.email, Purpose.SignUp);
	return new Response('Ok');
}
