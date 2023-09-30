<script lang="ts">
	import UserOverview from '$lib/components/UserOverview.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="banner">
	<div class="left">
		<h1>Build a better sleep schedule, <span>and give in the meantime</span></h1>
		<p>
			SleepOrGive helps you sleep better by encouraging you to go to bed at the same time every day,
			sending you reminders, and keeping a record of your bedtime. You will be asked to make a
			charity donation of £1 for every minute you slip up in each month.
		</p>
		<div>
			<a href="/join" class="button">Sign up now</a>
		</div>
	</div>
	<div class="right">
		<img src="/banner-drawing.svg" alt="a persoon in a bed, a red floating heart" />
	</div>
</div>

<div class="content">
	<p>
		See how it works:
	</p>
	<UserOverview data={data.homeData} />
</div>

<style>
	.banner {
		background-color: var(--color-light-gray);
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		padding: 30px 80px;
	}

	h1 > span {
		display: inline-block;
	}

	.left,
	.right {
		flex: 1 1 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 10px;
	}

	@media (max-width: 700px) {
		.banner {
			flex-direction: column;
			padding: 30px;
		}
	}

	.left p {
		text-align: justify;
		hyphens: auto;
	}

	.right img {
		width: 100%;
		max-width: 400px;
		align-self: center;
	}

	.content {
		padding: 20px;
		max-width: 1100px;
		margin-left: auto;
		margin-right: auto;
	}
</style>
