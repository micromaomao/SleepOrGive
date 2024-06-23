<script lang="ts">
	import { browser } from '$app/environment';
	import { useAuthContext } from '$lib/AuthenticationContext';
	import Alert from '$lib/components/Alert.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';
	import type { UserData } from '$lib/shared_types';
	import { onMount } from 'svelte';
	import PageContentWithData from './PageContentWithData.svelte';

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

	function reloadData() {
		if ($authContext.user_id) {
			userDataPromise = fetchUserData($authContext.user_id);
		}
	}

	onMount(() => {
		const interval = setInterval(() => {
			if (window.document.visibilityState == "hidden") {
				return;
			}
			fetchUserData($authContext.user_id).then((data) => {
				userDataPromise = Promise.resolve(data);
			});
		}, 60000);
		return () => clearInterval(interval);
	});
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
		<PageContentWithData {data} reload={reloadData} />
	{:catch e}
		<div class="content">
			<Alert hasRetry on:retry={() => (userDataPromise = fetchUserData($authContext.user_id))}>
				{e.message}
			</Alert>
		</div>
	{/await}
{/if}
