import type { UserData } from '$lib/types';
import { queryFlag } from '$lib/validations';
import { error, json, type RequestEvent } from '@sveltejs/kit';

export function GET({ params, locals, url }: RequestEvent) {
	let user_id = params.id;
	let include_history = queryFlag(url.searchParams.get('include_history'), 'include_history');
	let is_me = locals.user && locals.user.user_id == user_id;
	// TODO
	let data: UserData = {
		user_id: '01HBJZFQNGZZ675MWV7BHN19CD',
		username: 'maowtm',
		sleep_data: {
			currentYear: 2023,
			currentMonth: 8
		}
	};
	if (user_id != data.user_id) {
		throw error(404, 'User not found or not public.');
	}
	return json(data);
}
