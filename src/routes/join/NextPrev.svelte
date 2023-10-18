<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let disabled: boolean = false;
	const dispatch = createEventDispatcher();

	export let hasPrev: boolean = true;
	export let overrideNext: string | null = null;
</script>

<div class="nextprev">
	{#if hasPrev}
		<!-- Using a here because using button causes form submit to click the "back" button -->
		<a
			tabindex="0"
			role="button"
			class="back"
			on:click={(evt) => dispatch('back')}
			on:keydown={(evt) => {
				if (evt.key == 'Enter') {
					dispatch('back');
				}
			}}>Back</a
		>
	{/if}
	<input
		type="submit"
		class="next primary"
		value={overrideNext !== null ? overrideNext : 'Next'}
		{disabled}
		on:click={(evt) => {
			evt.preventDefault();
			dispatch('next');
		}}
	/>
</div>

<style lang="scss">
	@import './shared.scss';
</style>
