<script lang="ts">
	import { page } from '$app/stores';

	$: error = $page.error;
</script>

<div class="content">
	{#if error.codeExpired}
		<h1>This code has expired.</h1>
		<p>Please request a new one.</p>
	{:else}
		<h1>Error getting verification code</h1>
		<p>
			{error.message}
		</p>
	{/if}
</div>
