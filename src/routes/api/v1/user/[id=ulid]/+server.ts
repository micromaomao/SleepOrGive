import { fetchUserData, isUserPublic } from '$lib/server/user';
import type { UserData } from '$lib/types';
import { queryFlag } from '$lib/validations';
import { error, json, type RequestEvent } from '@sveltejs/kit';

export async function GET({ params, locals, url }: RequestEvent) {
	let user_id = params.id;
	let include_history = queryFlag(url.searchParams.get('include_history'), 'include_history');
	let is_me = locals.user && locals.user.user_id == user_id;
	if (!is_me) {
		let is_public = await isUserPublic(user_id);
		if (!is_public) {
			throw error(403, 'No permission');
		}
	}
	let user_data = await fetchUserData(user_id, include_history);
	return json(user_data);
}
