import type { UserOverviewData } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({}) => {
	let myData: UserOverviewData = {
		username: 'maowtm',
		currentYear: 2023,
		currentMonth: 8
	};
	return {
		homeData: myData
	};
};
