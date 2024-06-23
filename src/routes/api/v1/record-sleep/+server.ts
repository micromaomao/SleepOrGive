
import { error } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { parseDate } from '$lib/validations';
import { recordSleep } from '$lib/server/sleep_record';

export async function POST({ locals, request }: RequestEvent): Promise<Response> {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}
	let body = await request.json();
	if (typeof body != 'object') {
		throw error(400, 'Invalid request body');
	}
  if (typeof body.date != 'string') {
    throw error(400, 'Missing date.');
  }
  let date = parseDate(body.date, locals.user.timezone);
  if (typeof body.timestampMillis != "number") {
    throw error(400, 'Missing timestampMillis.');
  }
  let timeMs = body.timestampMillis;
  await recordSleep(locals.user.user_id, date.toISODate(), timeMs);
  return new Response(null, { status: 204 });
}
