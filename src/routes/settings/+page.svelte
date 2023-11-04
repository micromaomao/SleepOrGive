<script lang="ts">
	import { useAuthContext } from '$lib/AuthenticationContext';
	import Alert from '$lib/components/Alert.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';
	import type { UserSettings } from '$lib/shared_types';

	const authContext = useAuthContext();

	let currentUserSetting: UserSettings | null = null;
	let loadSettingsPromise: Promise<UserSettings> = null;
	function loadSettings() {
		if ($authContext.isAuthenticated) {
			loadSettingsPromise = $authContext
				.fetch('/api/v1/user/me/settings', { method: 'GET' })
				.then((res) => res.json());
		} else {
			loadSettingsPromise = Promise.reject(new Error('Unauthenticated'));
		}
	}
	$: loadSettings();
</script>

<div class="content">
	{#if !$authContext.isAuthenticated}
		<Alert intent="error">
			You must be <a href="/login">logged in</a> to view this page.
		</Alert>
	{:else}
		<h1>Settings</h1>
		{#await loadSettingsPromise}
			<Skeleton />
		{:then loadedSettings}
			<pre>{JSON.stringify(loadedSettings, null, 2)}</pre>
		{:catch e}
			<Alert intent="error">
				{e.message}
			</Alert>
		{/await}
	{/if}
</div>
