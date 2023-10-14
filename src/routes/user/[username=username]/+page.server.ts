import { usernameToId } from '$lib/server/user';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	let username = params.username;
	let user_id = await usernameToId(username);
	throw redirect(302, `/user/${user_id}`);
};
