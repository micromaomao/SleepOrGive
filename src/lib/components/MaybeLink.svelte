<script lang="ts">
	export let href: string | null = null;
</script>

{#if href !== null}
	<a {href}>
		<slot />
	</a>
{:else}
	<slot />
{/if}
