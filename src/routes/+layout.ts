import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ route }) => {
	return {
		title: '',
		is_admin_page: false
	};
};
