<script lang="ts">
	import { browser } from '$app/environment';
	import { useAuthContext } from '$lib/AuthenticationContext';
	import Alert from '$lib/components/Alert.svelte';
	import UserOverview from '$lib/components/UserOverview.svelte';
	import type { UserData } from '$lib/shared_types';

	let authContext = useAuthContext();

	function fetchUserData(user_id: string): Promise<UserData> {
		return $authContext.fetch(`/api/v1/user/${encodeURIComponent(user_id)}`).then(r => r.json());
	}

	let userDataPromise: Promise<UserData>;
	$: userDataPromise = $authContext.user_id
		? fetchUserData($authContext.user_id)
		: new Promise(() => {});
</script>

{#if !$authContext.isAuthenticated}
	{#if browser}
		<div class="content">
			You need to <a href="/login">log in</a> to view this page.
		</div>
	{/if}
{:else}
	{#await userDataPromise}
		<div class="content">Loading your data</div>
	{:then data}
		<div class="content">
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
