<script lang="ts">
	import Alert from '$lib/components/Alert.svelte';
	import UserOverview from '$lib/components/UserOverview.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="content">
	{#if data.userData}
		<UserOverview data={data.userData} />
	{:else if data.status}
		<Alert intent="error">
			{data.status}
			{data.message}
		</Alert>
	{/if}
</div>
