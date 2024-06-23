<script lang="ts">
	import { TimezoneContext, newTimezoneContext, useTimezoneContext } from '$lib/TimezoneContext';
	import UserOverview from '$lib/components/UserOverview.svelte';
	import type { SleepRecord, UserData } from '$lib/shared_types';
	import { parseTime } from '$lib/textutils';
	import { getTargetForToday, luxonNow } from '$lib/time';
	import { DateTime, type Duration } from 'luxon';
	import { onMount } from 'svelte';
	import SubBuuttonLinks from './SubBuuttonLinks.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import { useAuthContext } from '$lib/AuthenticationContext';
	import { sleepingLayout } from '../layoutContext';

	export let data: UserData;
  export let reload: () => void;

	$: timezoneContext = TimezoneContext.fromZoneName(data.timezone);

	const authContext = useAuthContext();

	let submittingSleep = false;
	let submissionError = null;

	async function handleSleepNow() {
		if (submittingSleep) {
			return;
		}
		submittingSleep = true;
		try {
			let res = await $authContext.fetch('/api/v1/record-sleep', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					date: currentDay.toISODate(),
					timestampMillis: now.toMillis()
				})
			});
			if (!res.ok) {
				throw new Error((await res.json()).message);
			}
      submittingSleep = false;
      submissionError = null;
      reload();
		} catch (e) {
			submissionError = e;
		} finally {
			submittingSleep = false;
		}
	}
	function handleRecordDonation() {}

	let now: DateTime;
	$: now = luxonNow(timezoneContext);
	let currentDay: DateTime;
	let currentTargetTime: DateTime;
	let currentDayRecord: SleepRecord;
	let timeSinceRecord: Duration | null;
	let timeDiff: Duration | null;

	$: $sleepingLayout = !!currentDayRecord;

	$: {
		if (now) {
			({ day: currentDay, target_time: currentTargetTime } = getTargetForToday(
				timezoneContext,
				parseTime(data.sleep_target)
			));
			currentDayRecord = data.sleep_data.records.filter((r) => r.date == currentDay.toISODate())[0];
			if (currentDayRecord) {
				timeSinceRecord = now.diff(
					DateTime.fromMillis(currentDayRecord.actualSleepTimeMillis, {
						zone: timezoneContext.zone
					})
				);
			} else {
				timeSinceRecord = null;
			}
			if (currentTargetTime > now) {
				timeDiff = currentTargetTime.diff(now).rescale();
			} else {
				timeDiff = now.diff(currentTargetTime).rescale();
			}
		}
	}

	onMount(() => {
		const interval = setInterval(() => {
			if (submittingSleep || submissionError) {
				return;
			}
			now = luxonNow(timezoneContext);
		}, 1000);
		return () => {
			$sleepingLayout = false;
		};
	});
</script>

<div class="content" class:sleeping={!!currentDayRecord}>
	{#if !currentDayRecord}
		{#if now > currentTargetTime.minus({ hours: 8 })}
			<h1>
				Good evening{#if data.username}, {data.username}{/if}!
			</h1>
			<p class="status" class:danger={now > currentTargetTime.plus({ minutes: 1 })}>
				{#if currentTargetTime > now}
					Ready for a good night's sleep? Your sleep target is {currentTargetTime.toLocaleString(
						DateTime.TIME_SIMPLE
					)}.
				{:else if now <= currentTargetTime.plus({ minutes: 1 })}
					You've came just in time - ready for a good night's sleep?
				{:else}
					You've missed your sleep target for today by
					{#if timeDiff.hours > 0}
						{timeDiff.hours} hours and {timeDiff.minutes} minutes.
					{:else}
						{timeDiff.minutes} minutes.
					{/if}
					Go to bed now!
				{/if}
			</p>

			<div class="btns">
				<div>
					<button
						class="sleep-now"
						class:danger={now > currentTargetTime.plus({ minutes: 1 })}
						on:click={handleSleepNow}
						disabled={submittingSleep}
					>
						{#if !submittingSleep}
							Sleep now
						{:else}
							Submitting&hellip;
						{/if}
						<br />
						{#if now < currentTargetTime}
							<span class="sleepnow-time-left">
								{#if timeDiff.hours > 0}
									{timeDiff.toFormat('hh:mm:ss')}
								{:else}
									{timeDiff.toFormat('mm:ss')}
								{/if}
							</span>
						{/if}
					</button>
				</div>
				<SubBuuttonLinks {handleRecordDonation} />
			</div>
			{#if submissionError}
				<Alert intent="error" hasRetry={false}>
					Error submitting sleep record: {submissionError.message}<br />
					Please try again.
				</Alert>
			{/if}
		{:else}
			<h1>
				Hi{#if data.username}, {data.username}{/if}! Remember to come back tonight to record your
				sleep.
			</h1>

			<div class="btns">
				<SubBuuttonLinks {handleRecordDonation} />
			</div>
		{/if}
		<UserOverview {data} />
	{:else if timeSinceRecord.as('hours') < 5}
		<h1>Hi again 👀</h1>
    <h1 style="margin-top: 14px;">{now.toLocaleString(DateTime.TIME_24_WITH_SECONDS)}</h1>
		<p>You're supposed to be asleep {Math.floor(timeSinceRecord.as('minutes'))} mins ago. Please go to bed now.</p>
		<div class="btns">
			<div>
				<button
					class="sleep-now"
					class:danger={true}
					on:click={handleSleepNow}
					disabled={submittingSleep}
				>
					{#if !submittingSleep}
						Oops, my bad
					{:else}
						Submitting&hellip;
					{/if}
					<br />
					<span class="sleepnow-time-left"> I didn't &mdash; but I will now. </span>
				</button>
			</div>
		</div>
	{/if}
</div>

<style lang="css">
	.sleeping {
		flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
	}

	.status {
		font-size: 20px;
	}

	.status.danger {
		color: #c43434;
	}

	.sleep-now {
		font-size: 20px;
	}

	.btns {
		margin: 12px 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
	}

	.sleepnow-time-left {
		font-size: 70%;
		line-height: 1;
		font-weight: 600;
	}
</style>
