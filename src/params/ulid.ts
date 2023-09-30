import type { ParamMatcher } from '@sveltejs/kit';

export const match: ParamMatcher = (str) => {
	// 01ARZ3NDEKTSV4RRFFQ69G5FAV
	return /^[a-zA-Z0-9]{26}$/.test(str);
};
