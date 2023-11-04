import { browser } from '$app/environment';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getAuthContext } from '$lib/AuthenticationContext';

export const load: PageLoad = async ({ params, fetch }) => {
	let user_id = params.id;
	let headers = undefined;
	if (browser) {
		headers = {
			Authorization: `Bearer ${getAuthContext().bearer}`
		};
	}
	let res = await fetch(`/api/v1/user/${user_id}?include_older_history=false`, {
		headers
	});
	if (!res.ok && res.status != 403) {
		throw error(res.status, await res.json());
	}
	if (res.ok) {
		return {
			userData: await res.json()
		};
	} else {
		return {
			userData: null,
			status: res.status,
			message: (await res.json()).message
		};
	}
};
