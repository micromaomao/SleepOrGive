import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({}) => {
	return {
		is_admin_page: true
	};
};

export const ssr = false;
