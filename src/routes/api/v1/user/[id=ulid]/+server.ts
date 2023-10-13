import { fetchUserData, isUserPublic } from '$lib/server/user';
import type { UserData } from '$lib/shared_types';
import { queryFlag } from '$lib/validations';
import { error, json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';

export async function GET({ params, locals, url }: RequestEvent) {
	let user_id = params.id;
	let include_older_history = queryFlag(
		url.searchParams.get('include_older_history'),
		'include_older_history'
	);
	let is_me = locals.user && locals.user.user_id == user_id;
	if (!is_me) {
		let is_public = await isUserPublic(user_id);
		if (!is_public) {
			throw error(403, 'No permission');
		}
	}
	let user_data = await fetchUserData(user_id, include_older_history);
	return json(user_data);
}
