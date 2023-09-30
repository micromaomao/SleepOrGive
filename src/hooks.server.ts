import dotenv from 'dotenv';

dotenv.config();

import * as db from '$lib/server/db';
import type { Handle } from '@sveltejs/kit';
import { checkAuthentication } from '$lib/server/auth';

db.init().catch((e) => {
	console.error(e);
	throw e;
});

export const handle: Handle = async ({ event, resolve }) => {
	let maybeAuth = await checkAuthentication(event);
	if (maybeAuth) {
		event.locals.user = maybeAuth;
	}
	return await resolve(event);
};
