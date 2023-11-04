<script lang="ts">
	import { browser } from '$app/environment';
	import { useAuthContext } from '$lib/AuthenticationContext';
	import Alert from '$lib/components/Alert.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';
	import UserOverview from '$lib/components/UserOverview.svelte';
	import type { UserData } from '$lib/shared_types';

	let authContext = useAuthContext();

	function fetchUserData(user_id: string): Promise<UserData> {
		return $authContext
			.fetch(`/api/v1/user/${encodeURIComponent(user_id)}?include_older_history=true`)
			.then((r) => r.json());
	}

	let userDataPromise: Promise<UserData>;
	$: userDataPromise = $authContext.user_id
		? fetchUserData($authContext.user_id)
		: new Promise(() => {});

	function handleRecordDonation() {}
</script>

{#if !$authContext.isAuthenticated}
	{#if browser}
		<div class="content">
			You need to <a href="/login">log in</a> to view this page.
		</div>
	{/if}
{:else}
	{#await userDataPromise}
		<div class="content">
			<Skeleton />
		</div>
	{:then data}
		<div class="content">
			<h1>
				Good evening{#if data.username}, {data.username}{/if}!
			</h1>

			<div class="btns">
				<div>
					<button class:danger={false}>
						Sleep now <br />
						<span class="sleepnow-minutes-left">30 minutes left</span>
					</button>
				</div>
				<div>
					<a
						on:click={handleRecordDonation}
						on:keydown={(e) => e.key == 'Enter' && handleRecordDonation()}
						role="link"
						tabindex="0">Record donation</a
					>
					<a href="/settings">User settings</a>
				</div>
			</div>

			<UserOverview {data} />
		</div>
	{:catch e}
		<div class="content">
			<Alert hasRetry on:retry={() => (userDataPromise = fetchUserData($authContext.user_id))}>
				{e.message}
			</Alert>
		</div>
	{/await}
{/if}

<style lang="scss">
	.btns {
		margin: 12px 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
	}

	.btns > div {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: flex-end;
		gap: 15px;
	}

	.sleepnow-minutes-left {
		font-size: 70%;
		line-height: 1;
		font-weight: 600;
	}
</style>
