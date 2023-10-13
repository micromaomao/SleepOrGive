import { mustBeValidUsername } from '$lib/validations';
import type { ParamMatcher } from '@sveltejs/kit';

export const match: ParamMatcher = (str) => {
	try {
		mustBeValidUsername(str);
		return true;
	} catch (e) {
		return false;
	}
};
