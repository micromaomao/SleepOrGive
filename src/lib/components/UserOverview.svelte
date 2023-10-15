<script lang="ts">
	import { useAuthContext } from '$lib/AuthenticationContext';
	import { toHumanMonth } from '$lib/textutils';
	import type { UserData } from '$lib/shared_types';
	import MaybeLink from './MaybeLink.svelte';
	import UserProfilePicture from './UserProfilePicture.svelte';
	import { TimezoneContext, newTimezoneContext } from '$lib/TimezoneContext';

	export let data: UserData;

	let authContext = useAuthContext();
	$: isMe = $authContext.isAuthenticated && $authContext.user_id == data.user_id;
	$: sleepData = data.sleep_data;
	$: historyData = false;

	const timezoneContext = newTimezoneContext(TimezoneContext.fromZoneName(data.timezone));

	import { page } from '$app/stores';
	$: isOnUserPage = $page.url.pathname == `/user/${encodeURIComponent(data.user_id)}`;
</script>

<h2>
	<div class="profilepic">
		<UserProfilePicture user_id={data.user_id} username={data.username} size={30} />
	</div>
	<MaybeLink href={isMe || isOnUserPage ? null : `/user/${encodeURIComponent(data.user_id)}`}>
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
	h2 {
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	.profilepic {
		margin-right: 10px;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

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
