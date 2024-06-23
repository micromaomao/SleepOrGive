<script lang="ts">
	// This component is used to display a text-only notice.
	export let text: string;
	$: lines = text.split('\n');
</script>

{#each lines as line, i}
	{line}{#if i < lines.length - 1}<br>{/if}
{/each}
