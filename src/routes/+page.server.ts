import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSiteStats } from '$lib/server/misc';
import { usernameToId } from '$lib/server/user';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
	let homeDataFetch = usernameToId('maowtm').then(maowtm_userid => fetch(`/api/v1/user/${maowtm_userid}`)).then(async (r) => {
		if (!r.ok) {
			throw error(r.status, await r.json());
		}
		return await r.json();
	});
	homeDataFetch.catch(() => { /* no-op to catch error thrown before promise is pulled by svelte: https://kit.svelte.dev/docs/load#streaming-with-promises */ });
	let siteStats = await getSiteStats().then(null, e => Promise.reject(error(500, { message: "Failed to fetch site statistics: " + e })));
	return {
		homeData: homeDataFetch,
		...siteStats
	};
};
