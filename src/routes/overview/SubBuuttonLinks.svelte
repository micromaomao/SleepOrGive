<script lang="ts">
	export let handleRecordDonation: () => void;
</script>

<div>
	<!-- svelte-ignore a11y-no-redundant-roles -->
	<!-- svelte-ignore a11y-missing-attribute -->
	<a
		on:click={handleRecordDonation}
		on:keydown={(e) => e.key == 'Enter' && handleRecordDonation()}
		role="link"
		tabindex="0">Record donation</a
	>
	<a href="/settings">User settings</a>
</div>

<style>
	div {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: flex-end;
		gap: 15px;
	}
</style>
