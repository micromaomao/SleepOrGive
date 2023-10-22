import { acquireCode } from '$lib/server/email/verification';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from '../$types';

export const load: PageServerLoad = async ({ url }) => {
	let code_ticket = url.searchParams.get('code_ticket');
	if (!code_ticket) {
		throw error(404, 'Missing code ticket.');
	}
	let code = await acquireCode(code_ticket);
	return {
		title: 'Verification code',
		code
	};
};
