import { logoutSession } from '$lib/server/auth';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST(req_evt: RequestEvent) {
	await logoutSession(req_evt);
}
