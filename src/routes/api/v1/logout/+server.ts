import { logoutSession } from '$lib/server/auth';
import { json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';

export async function POST(req_evt: RequestEvent) {
	await logoutSession(req_evt);
	return json({});
}
