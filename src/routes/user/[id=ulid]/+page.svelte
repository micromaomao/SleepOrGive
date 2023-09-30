<script lang="ts">
	import UserOverview from '$lib/components/UserOverview.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="content">
	<UserOverview data={data.userData} />
</div>
