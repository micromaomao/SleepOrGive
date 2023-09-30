import { logoutSession } from '$lib/server/auth';
import type { RequestEvent } from './$types';

export async function POST(req_evt: RequestEvent) {
	await logoutSession(req_evt);
}
