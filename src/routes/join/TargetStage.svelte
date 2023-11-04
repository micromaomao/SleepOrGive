<script lang="ts">
	import { browser } from '$app/environment';
	import { useTimezoneContext } from '$lib/TimezoneContext';
	import TargetTimeSlider from '$lib/components/TargetTimeSlider.svelte';
	import { parseTime } from '$lib/textutils';
	import { createEventDispatcher } from 'svelte';
	import NextPrev from './NextPrev.svelte';
	const dispatch = createEventDispatcher();

	export let sleepTargetTime: string = '23:00';
	$: sleepTimeValidation = ((value: string) => {
		try {
			let [h, m, s] = parseTime(value);
		} catch (e) {
			return e.message ?? e.body.message ?? e.toString();
		}
	})(sleepTargetTime);

	const timezoneContext = useTimezoneContext();
	$: timezoneStr = browser ? $timezoneContext.name : 'UTC';
</script>

<h1>
	What is your goal?
	<img
		src="https://em-content.zobj.net/source/twitter/376/direct-hit_1f3af.png"
		alt="bullseye"
		class="emoji"
	/>
</h1>

<form
	action="#"
	on:submit={(evt) => {
		evt.preventDefault();
		dispatch('next');
	}}
>
	<p>
		Choose a target bedtime that suits you. To take advantage of this app, you will need to record
		your actual bed time everyday. This will be compared with your target bedtime, and every month
		you will be asked to donate a certain amount of money for each minute you slip.
	</p>

	<p>
		Remember: This is the time you aim to be in bed by, not the time you start getting ready. You
		can enable reminders before your target bedtime to help you get ready in time.
	</p>

	<br />

	<TargetTimeSlider bind:targetTime={sleepTargetTime} />

	<p style="font-size: 14px;">
		Your current timezone is {timezoneStr}.
	</p>

	<NextPrev nextDisabled={!!sleepTimeValidation} />

	{#if sleepTimeValidation}
		<p class="error">
			{sleepTimeValidation}
		</p>
	{/if}
</form>

<style lang="scss">
	@import './shared.scss';
</style>
