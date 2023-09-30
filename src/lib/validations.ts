import { error } from '@sveltejs/kit';

export function mustBeUlid(str: string, field_name: string) {
	if (!/^[a-zA-Z0-9]{26}$/.test(str)) {
		throw error(400, `Invalid ${field_name}: must be valid ulid`);
	}
}

export function authenticationBearer(auth_header: string): string | null {
	if (!auth_header) {
		return null;
	}
	const BEARER = 'Bearer ';
	if (!auth_header.startsWith(BEARER)) {
		return null;
	}
	return auth_header.slice(BEARER.length);
}

export function queryFlag(value: string, field_name: string): boolean {
	if (value == 'true') {
		return true;
	} else if (!value || value == 'false') {
		return false;
	} else {
		throw error(400, `Invalid value for ${field_name} - specify either true or false.`);
	}
}

export function toInteger(value: string, field_name: string): number {
	if (!/^-?[0-9]+$/.test(value)) {
		throw error(400, `Invalid value for ${field_name} - must be an integer.`);
	}
	let n = parseInt(value);
	if (!Number.isSafeInteger(n)) {
		throw error(400, `Invalid value for ${field_name}.`);
	}
	return n;
}
