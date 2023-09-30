<script lang="ts">
	import { toHumanMonth } from '$lib/timeutils';
	import type { UserOverviewData } from '$lib/types';

	export let data: UserOverviewData;
</script>

<h2>Overview for {data.username}</h2>

<h3 class="currentMonth">
	{toHumanMonth(data.currentMonth)}
	{data.currentYear}
</h3>

<div class="stats">
	<div class="stat">
		<span class="number">0</span>
		<span class="label">days recorded</span>
	</div>
	<div class="stat">
		<span class="number">0</span>
		<span class="label">minutes slipped</span>
	</div>
	<div class="stat">
		<span class="number">£0</span>
		<span class="label">pending donation</span>
	</div>
</div>

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
