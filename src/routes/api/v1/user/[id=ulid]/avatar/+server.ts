import { fetchUserAvatarUrl, isUserPublic } from '$lib/server/user';
import { toInteger } from '$lib/validations';
import { error } from '@sveltejs/kit';
import type { RequestEvent } from './$types';

export async function GET({ params, locals, url }: RequestEvent) {
	let user_id = params.id;
	let size = toInteger(url.searchParams.get('size') ?? '256', 'size');
	let user_avatar_url = await fetchUserAvatarUrl(user_id, size);
	let res = await fetch(user_avatar_url);
	if (!res.ok) {
		throw error(500, 'Failed to fetch avatar');
	}
	return new Response(res.body, {
		headers: {
			'Content-Type': res.headers.get('Content-Type'),
			'Content-Length': res.headers.get('Content-Length')
		}
	});
}
