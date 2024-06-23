import { error } from '@sveltejs/kit';
import { parseTime } from './textutils';
import type { UserSettings } from './shared_types';
import { TimezoneContext } from './TimezoneContext';
import { luxonDateFromStr } from './time';
import type { DateTime } from 'luxon';

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

export function mustBeValidDonationAmount(amount: string) {
	if (!/^[0-9]*(\.[0-9]{1,2})?$/.test(amount) || amount.length == 0) {
		throw error(400, 'Invalid donation amount.');
	}
	let parsed = parseFloat(amount);
	if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
		throw error(400, 'Invalid donation amount.');
	}
}

export function mustBeValidNotificationTimeOffsets(offsets: number[]) {
	for (let offset of offsets) {
		if (!Number.isSafeInteger(offset)) {
			throw error(400, 'Invalid notification time offset.');
		}
		if (offset < -12 * 60 || offset > 12 * 60) {
			throw error(400, 'Invalid notification time offset.');
		}
	}
}

export const ALLOWED_CURRENCIES = ['GBP', 'USD', 'CNY', 'JPY'];

export function mustBeValidCurrency(currency: string) {
	if (!ALLOWED_CURRENCIES.includes(currency)) {
		throw error(400, 'Invalid currency.');
	}
}

export function mustBeValidVerificationCode(code: string) {
	if (!/^[0-9]{6}$/.test(code)) {
		throw error(400, 'Invalid verification code.');
	}
}

export function mustBeValidTimezone(timezone: string) {
	let tzc = TimezoneContext.fromZoneName(timezone);
	if (!tzc) {
		throw error(400, `${timezone} is not a valid IANA timezone.`);
	}
}

export function parseDate(date: string, zone: TimezoneContext = TimezoneContext.fromZoneName("UTC")): DateTime {
	if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)) {
		throw error(400, 'Invalid date string.');
	}
	let d = luxonDateFromStr(date, zone);
	if (!d.isValid) {
		throw error(400, `Invalid date: ${d.invalidReason}`);
	}
	return d;
}

export function validateUserSettings(json: UserSettings) {
	if (json.username && typeof json.username != 'string') {
		throw error(400, 'Invalid username.');
	}
	if (json.username) {
		mustBeValidUsername(json.username);
	} else {
		json.username = null;
	}
	if (typeof json.email != 'string') {
		throw error(400, 'Missing email.');
	}
	mustBeValidEmail(json.email);
	if (typeof json.timezone != 'string') {
		throw error(400, 'Missing timezone.');
	}
	mustBeValidTimezone(json.timezone);
	if (typeof json.profileIsPublic != 'boolean') {
		throw error(400, 'Missing profile_public.');
	}
	if (typeof json.sleepTargetTime != 'string') {
		throw error(400, 'Missing sleepTargetTime.');
	}
	parseTime(json.sleepTargetTime);
	if (typeof json.donationAmount != 'string') {
		throw error(400, 'Missing donationAmount.');
	}
	mustBeValidDonationAmount(json.donationAmount);
	if (typeof json.currency != 'string') {
		throw error(400, 'Missing currency.');
	}
	mustBeValidCurrency(json.currency);
	if (
		!Array.isArray(json.sleepNotificationTimeOffsets) ||
		json.sleepNotificationTimeOffsets.some((x) => typeof x != 'number')
	) {
		throw error(400, 'Missing sleepNotificationTimeOffsets.');
	}
	mustBeValidNotificationTimeOffsets(json.sleepNotificationTimeOffsets);
}
