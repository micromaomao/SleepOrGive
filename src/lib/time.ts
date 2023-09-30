import { DateTime } from 'luxon';
import type { TimezoneContext } from './TimezoneContext';
import { browser } from '$app/environment';

const SERVER_DEBUG_SKEW = 0;

let client_clock_skew = 0;

export function nowMillis(): number {
	if (browser) {
		return Date.now() + client_clock_skew;
	} else {
		return Date.now() + SERVER_DEBUG_SKEW;
	}
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
					client_clock_skew = json.millis - fetch_time;
					console.log(`Client clock skew: ${client_clock_skew}ms`);
					setTimeout(adjustClockSkew, 60000);
				}
			}
		});
	}
	adjustClockSkew();
}
