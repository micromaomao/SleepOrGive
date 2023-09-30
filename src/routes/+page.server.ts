import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
	if (cookies.get('session')) {
		throw redirect(302, '/overview');
	}
	let homeDataFetch = await fetch('/api/v1/user/01HBJZFQNGZZ675MWV7BHN19CD');
	if (!homeDataFetch.ok) {
		throw error(homeDataFetch.status, await homeDataFetch.json());
	}
	return {
		homeData: await homeDataFetch.json(),
		nbUsers: 0,
		totalAmountDonated: 0
	};
};
