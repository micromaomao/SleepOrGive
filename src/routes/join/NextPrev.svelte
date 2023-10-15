<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let disabled: boolean = false;
	const dispatch = createEventDispatcher();

	export let hasPrev: boolean = true;
</script>

<div class="nextprev">
	{#if hasPrev}
		<a
			tabindex="0"
			role="link"
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
		value="Next"
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
