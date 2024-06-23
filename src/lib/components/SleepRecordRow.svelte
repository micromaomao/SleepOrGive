<script lang="ts">
	import { TimezoneContext } from '$lib/TimezoneContext';
	import type { SleepRecord } from '$lib/shared_types';
	import { luxonDateFromStr } from '$lib/time';
	import { DateTime } from 'luxon';

	export let row: SleepRecord;
  $: tz = TimezoneContext.fromZoneName(row.timezone);
	$: date = luxonDateFromStr(row.date, tz);
  $: sleepTime = DateTime.fromMillis(row.actualSleepTimeMillis, { zone: tz.zone });
  $: targetTime = DateTime.fromMillis(row.targetMillis, { zone: tz.zone });
  $: isOnTarget = sleepTime < targetTime.plus({ minutes: 1 });
  $: isBeforeTarget = sleepTime < targetTime;

  function minutesToHuman(mins: number): string {
    let hours = Math.floor(mins / 60);
    let minutes = mins % 60;
    if (hours === 0) {
      return `${minutes} minutes`;
    }
    return `${hours} hours ${minutes} minutes`;
  }
</script>

<li>
  <span class="date">{date.toFormat('dd')}</span>
  {#if isBeforeTarget}
    <span class="rel early">{minutesToHuman(Math.ceil(targetTime.diff(sleepTime, 'minutes').minutes))} early</span>
  {:else if isOnTarget}
    <span class="rel early">Right on time</span>
  {:else}
    <span class="rel late">{minutesToHuman(Math.floor(sleepTime.diff(targetTime, 'minutes').minutes))} late</span>
  {/if}
  ({sleepTime.toFormat('HH:mm')})

</li>

<style>
	li {
		margin: 10px 0;
		padding: 0;
    display: flex;
    flex-direction: row;
    gap: 10px;
    align-items: baseline;
	}

  span.date {
    font-size: 150%;
    margin-right: 14px;
    min-width: 30px;
  }

  span.rel {
    min-width: 200px;
    font-size: 110%;
  }

  .late {
    color: #c43434;
  }

  .early {
    color: #2e7e2e;
  }
</style>
