import { error } from '@sveltejs/kit';

export const ULID_RE = /^[a-zA-Z0-9]{26}$/;
export const USERNAME_RE_CHARSET = /^[a-zA-Z0-9_\-.~!^*()]*$/;
export const MIN_USERNAME_LENGTH = 2;
export const MAX_USERNAME_LENGTH = 32;
export const EMAIL = /^[^@]+@[^@]+$/;

export function mustBeUlid(str: string, field_name: string) {
	if (!ULID_RE.test(str)) {
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

export function mustBeValidUsername(username: string) {
	if (!USERNAME_RE_CHARSET.test(username)) {
		throw error(
			400,
			'Username can only contain letters, numbers, and a few other special characters.'
		);
	}
	if (ULID_RE.test(username)) {
		throw error(400, 'Username cannot be a valid ulid.');
	}
	if (username.length < MIN_USERNAME_LENGTH) {
		throw error(400, `Username must be at least ${MIN_USERNAME_LENGTH} characters long.`);
	}
	if (username.length > MAX_USERNAME_LENGTH) {
		throw error(400, `Username cannot be longer than ${MAX_USERNAME_LENGTH} characters.`);
	}
}

export function mustBeValidEmail(email: string) {
	if (!EMAIL.test(email)) {
		throw error(400, 'Invalid email address.');
	}
}

export function validateDonationAmount(amount: string) {
	if (!/^[0-9]*(\.[0-9]{1,2})?$/.test(amount) || amount.length == 0) {
		throw error(400, 'Invalid donation amount.');
	}
	let parsed = parseFloat(amount);
	if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
		throw error(400, 'Invalid donation amount.');
	}
}

export const ALLOWED_CURRENCIES = ['GBP', 'USD', 'CNY', 'JPY'];

export function mustBeValidVerificationCode(code: string) {
	if (!/^[0-9]{6}$/.test(code)) {
		throw error(400, 'Invalid verification code.');
	}
}
