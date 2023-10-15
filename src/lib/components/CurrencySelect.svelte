<script context="module" lang="ts">
	import type { TimezoneContext } from '$lib/TimezoneContext';

	export function guessCurrency(timezone: TimezoneContext) {
		let tz = timezone.zone.name;
		if (tz.startsWith('America/')) return 'USD';
		if (tz == 'Europe/London') return 'GBP';
		if (tz.startsWith('Europe/')) return 'EUR';
		if (tz == 'Asia/Shanghai') return 'CNY';
		if (tz == 'Asia/Tokyo') return 'JPY';
		return 'GBP';
	}
</script>

<script lang="ts">
	import { ALLOWED_CURRENCIES } from '$lib/validations';

	const permitted = ALLOWED_CURRENCIES;
	export let value: string;
</script>

<select bind:value>
	{#each permitted as currency}
		<option value={currency}>{currency}</option>
	{/each}
</select>
