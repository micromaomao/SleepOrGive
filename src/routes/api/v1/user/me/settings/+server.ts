import { getUserSettings, updateUserSettings } from '$lib/server/user';
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '../$types';

export async function GET({ locals }: RequestEvent): Promise<Response> {
	if (!locals.user) {
		throw new Error('Not logged in');
	}
	let settings = await getUserSettings(locals.user.user_id);
	return json(settings);
}

export async function PATCH({ locals, request }: RequestEvent): Promise<Response> {
	if (!locals.user) {
		throw new Error('Not logged in');
	}
	let body = await request.json();
	if (typeof body != 'object') {
		throw new Error('Invalid request body');
	}
	await updateUserSettings(locals.user.user_id, body);
	return json({ success: true });
}
