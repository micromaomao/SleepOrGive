<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { useAuthContext } from '$lib/AuthenticationContext';
	import Alert from '$lib/components/Alert.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';
	import UserOverview from '$lib/components/UserOverview.svelte';
	import { formatNumber } from '$lib/textutils';
	import type { PageData } from './$types';

	export let data: PageData;

	const authContext = useAuthContext();
</script>

<div class="banner">
	<div class="left">
		<h1>Build a better sleep schedule, <span>and give in the meantime</span></h1>
		<p>
			SleepOrGive helps you sleep better by encouraging you to go to bed at the same time every day,
			sending you reminders, and keeping a record of your bedtime. You will be asked to make a
			charity donation of £1 for every minute you slip up in each month.
		</p>
		<p class="impact">
			So far, <span class="total-users">{formatNumber(data.nbUsers)}</span> users have donated or
			pledged a total of
			<span class="impact-amount">£{formatNumber(data.totalAmountDonated)}</span>
		</p>
		<div class="signup">
			{#if !$authContext.isAuthenticated}
				<a href="/join" class="button">Sign up now</a>
			{:else}
				<a href="/overview" class="button">Go to your dashboard</a>
			{/if}
		</div>
	</div>
	<div class="right">
		<img
			src="/images/banner-drawing.svg"
			alt="a persoon in a bed, a red floating heart"
			width="400"
			height="400"
		/>
	</div>
</div>

<div class="content">
	<p>See how it works:</p>
	{#await data.homeData}
		<Skeleton />
	{:then homeData}
		<UserOverview data={homeData} />
	{:catch e}
		<Alert hasRetry={true} on:retry={() => invalidateAll()}>Error loading data: {e.message}</Alert>
	{/await}
</div>

<div class="footer">
	Built by <a href="https://maowtm.org" rel="me" target="_blank">maowtm</a>. See
	<a href="/privacy">privacy policy</a>.
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

	.right img {
		width: 100%;
		max-width: 400px;
		align-self: center;
	}

	@media (max-width: 800px) {
		.banner {
			flex-direction: column;
			padding: 30px;
		}

		.right img {
			max-width: 300px;
			max-height: 300px;
		}
	}

	.left p {
		text-align: justify;
		hyphens: auto;
	}

	h1,
	p {
		margin: 5px 0;
	}
	.impact span {
		font-size: 20px;
		font-weight: 600;
		margin-left: 5px;
		margin-right: 5px;
	}

	.signup {
		margin-top: 20px;
	}

	.footer {
		padding: 10px;
		text-align: center;
	}
</style>
