import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
	let homeDataFetch = fetch('/api/v1/user/01HEDRH973KWC3BF1EM7VREWD2').then(async (r) => {
		if (!r.ok) {
			throw error(r.status, await r.json());
		}
		return await r.json();
	});
	return {
		streamed: {
			homeData: homeDataFetch
		},
		nbUsers: 0,
		totalAmountDonated: 0
	};
};
