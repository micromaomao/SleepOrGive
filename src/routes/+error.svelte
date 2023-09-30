<script>
	import Alert from '$lib/components/Alert.svelte';

	import { page } from '$app/stores';
</script>

<div class="content">
	<Alert>
		{$page.status}
		{$page.error.message}
	</Alert>
</div>
