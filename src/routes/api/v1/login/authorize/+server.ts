import { error, json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { withDBClient } from '$lib/server/db';
import { createSession } from '$lib/server/auth';
import { mustBeUlid } from '$lib/validations';

export async function POST({ request, url, cookies }: RequestEvent) {
	throw error(501, 'Not implemented');
}
