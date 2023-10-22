import dotenv from 'dotenv';

dotenv.config();

import * as db from '$lib/server/db';
import type { Handle } from '@sveltejs/kit';
import { checkAuthentication } from '$lib/server/auth';
import { backgroundJobsManager } from '$lib/server/background_jobs';
import { emailBackgroundJob } from '$lib/server/email';

db.init()
	.then(() => {
		backgroundJobsManager.registerBackgroundJob(emailBackgroundJob);
		backgroundJobsManager.registerBackgroundJob(emailBackgroundJob);
		backgroundJobsManager.registerBackgroundJob(emailBackgroundJob);
		backgroundJobsManager.run();
	})
	.catch((e) => {
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
