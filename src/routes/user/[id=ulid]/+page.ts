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
	if (!res.ok) {
		throw error(res.status, await res.json());
	}
	return {
		userData: await res.json()
	};
};

export const ssr = false; // TODO: fix
