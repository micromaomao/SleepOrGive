import { json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { nowMillis } from '$lib/time';

export function GET({}: RequestEvent) {
	return json({
		millis: nowMillis()
	});
}
