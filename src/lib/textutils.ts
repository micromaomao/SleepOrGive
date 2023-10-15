import { error } from '@sveltejs/kit';

export function toHumanMonth(monthNumber: number): string {
	return {
		1: 'January',
		2: 'February',
		3: 'March',
		4: 'April',
		5: 'May',
		6: 'June',
		7: 'July',
		8: 'August',
		9: 'September',
		10: 'October',
		11: 'November',
		12: 'December'
	}[monthNumber]!;
}

export function formatNumber(number: number): string {
	return number.toLocaleString();
}

export function parseTime(time: string): [number, number, number] {
	if (/^[0-9]{1,2}:[0-9]{2}$/.test(time)) {
		const [hours, minutes] = time.split(':').map((n) => parseInt(n));
		if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
			throw error(400, 'Invalid time format.');
		}
		return [hours, minutes, 0];
	}
	if (/^[0-9]{1,2}:[0-9]{2}:[0-9]{2}$/.test(time)) {
		const [hours, minutes, seconds] = time.split(':').map((n) => parseInt(n));
		if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
			throw error(400, 'Invalid time format.');
		}
		return [hours, minutes, seconds];
	}
	throw error(400, 'Invalid time format.');
}
