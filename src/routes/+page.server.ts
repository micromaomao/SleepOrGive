import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSiteStats } from '$lib/server/misc';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
	let homeDataFetch = fetch('/api/v1/user/01HEDRH973KWC3BF1EM7VREWD2').then(async (r) => {
		if (!r.ok) {
			error(r.status, await r.json());
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
