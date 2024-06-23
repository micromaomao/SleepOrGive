import { DateTime } from 'luxon';
import type { TimezoneContext } from './TimezoneContext';
import { browser } from '$app/environment';

let clock_skew = 1000*60*60*4;

export function nowMillis(): number {
	return Date.now() + clock_skew;
}

export function luxonNow(timezone: TimezoneContext): DateTime {
	return DateTime.fromMillis(nowMillis(), {
		zone: timezone.zone
	});
}

if (browser) {
	function adjustClockSkew() {
		let fetch_start = Date.now();
		fetch('/api/v1/gettime').then(async (r) => {
			let fetch_end = Date.now();
			let json = await r.json();
			if (!r.ok) {
				console.error('Failed to fetch server time:', json.message);
			} else {
				let fetch_delay = fetch_end - fetch_start;
				if (fetch_delay > 1000) {
					console.warn(
						`Server time fetch took ${fetch_delay}ms - result invalid. Retrying in 5s...`
					);
					setTimeout(adjustClockSkew, 5000);
				} else {
					let fetch_time = fetch_start + fetch_delay / 2;
					clock_skew = json.millis - fetch_time;
					console.log(`Client clock skew: ${clock_skew}ms`);
					setTimeout(adjustClockSkew, 60000);
				}
			}
		});
	}
	adjustClockSkew();
}

type TargetTime = [number, number, number];

/**
 * Get the current "record day" and the exact time for the sleep target - for
 * example, this is usually the current date, or the previous date if it's after
 * midnight but "close enough" to the target time for the previous day.
 */
export function getTargetForToday(timezone: TimezoneContext, target: TargetTime): {
	day: DateTime,
	target_time: DateTime
} {
	let now = luxonNow(timezone);
	let today = now.startOf('day');
	let yesterday = today.minus({ days: 1 }); // Luxon take cares of DST
	let today_target = getTargetTimeForDate(today, target);
	let yesterday_target = getTargetTimeForDate(yesterday, target);
	if (Math.abs(now.toMillis() - today_target.toMillis()) <= Math.abs(now.toMillis() - yesterday_target.toMillis())) {
		return {
			day: today,
			target_time: today_target
		};
	} else {
		return {
			day: yesterday,
			target_time: yesterday_target
		};
	}
}

/**
 * Get the exact time for the sleep target for a given "record date". Assume
 * date has the correct timezone.
 */
export function getTargetTimeForDate(date: DateTime, target: TargetTime): DateTime {
	if (target[0] < 12) {
		// After midnight target - date represents previous day
		return date.plus({ days: 1 }).set({ hour: target[0], minute: target[1], second: target[2] });
	} else {
		return date.set({ hour: target[0], minute: target[1], second: target[2] });
	}
}

export function luxonDateFromStr(date: string, timezone: TimezoneContext): DateTime {
	return DateTime.fromISO(date, { zone: timezone.zone, outputCalendar: "iso8601" });
}

export function getTargetTimeFromDateStr(date: string, timezone: TimezoneContext, target: TargetTime): DateTime {
	return getTargetTimeForDate(luxonDateFromStr(date, timezone), target);
}

export function isTimeWithinRecordDay(time: DateTime, date: DateTime, target: TargetTime) {
	let target_time_for_this_day = getTargetTimeForDate(date, target);
	let target_time_for_prev_day = getTargetTimeForDate(date.minus({ days: 1 }), target);
	let target_time_for_next_day = getTargetTimeForDate(date.plus({ days: 1 }), target);
	let this_day_diff = Math.abs(time.toMillis() - target_time_for_this_day.toMillis());
	let prev_day_diff = Math.abs(time.toMillis() - target_time_for_prev_day.toMillis());
	let next_day_diff = Math.abs(time.toMillis() - target_time_for_next_day.toMillis());
	return this_day_diff < prev_day_diff && this_day_diff < next_day_diff;
}
