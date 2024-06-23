<script lang="ts">
	import Alert from '$lib/components/Alert.svelte';

	export let submissionError;
</script>

{#if submissionError}
	<Alert intent="error" hasRetry={false}>
		Error submitting sleep tracking: {submissionError.message}<br />
		Please try again.
	</Alert>
{/if}
