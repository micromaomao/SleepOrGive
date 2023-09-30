import dotenv from 'dotenv';

dotenv.config();

import * as db from '$lib/server/db';

db.init().catch((e) => {
	console.error(e);
	throw e;
});
