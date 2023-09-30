<script lang="ts">
	import { useAuthContext } from '$lib/AuthenticationContext';
	import { toHumanMonth } from '$lib/textutils';
	import type { UserData } from '$lib/types';
	import MaybeLink from './MaybeLink.svelte';

	export let data: UserData;

	let authContext = useAuthContext();
	$: isMe = $authContext.isAuthenticated && $authContext.user_id == data.user_id;
	$: sleepData = data.sleep_data;
	$: historyData = false;
</script>

<h2>
	<MaybeLink href={isMe ? null : `/user/${encodeURIComponent(data.user_id)}`}>
		Overview for {data.username}
	</MaybeLink>
</h2>

<div class="stats">
	<div class="stat">
		<span class="number">£0</span>
		<span class="label">pending donation</span>
	</div>
	<div class="stat">
		<span class="number">£0</span>
		<span class="label">total donated</span>
	</div>
	<div class="stat">
		<span class="number">0</span>
		<span class="label">days recorded</span>
	</div>
</div>

<h3 class="currentMonth">
	{toHumanMonth(sleepData.currentMonth)}
	{sleepData.currentYear}
</h3>

<p>TODO</p>

{#if historyData}
	<h3>Earlier</h3>

	<p>TODO</p>
{/if}

<style>
	.stats {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		padding: 10px;
	}

	.stat {
		flex: 1 1 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 10px;
		max-width: 200px;
	}

	.number {
		font-size: 30px;
		font-weight: 900;
	}
</style>
