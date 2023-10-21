<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Delete from '@fluentui/svg-icons/icons/delete_20_regular.svg?component';

	const dispatch = createEventDispatcher();

	export let minutes: number | undefined;
	export let empty: boolean;

	let input_value: string | number = empty ? '' : Math.abs(minutes);
	let before: boolean = empty ? true : minutes >= 0;

	function confirm() {
		if (input_value === '') {
			minutes = null;
			empty = true;
		} else {
			minutes = Number(input_value);
			empty = false;
			if (Number.isNaN(minutes) || !Number.isSafeInteger(minutes)) {
				minutes = null;
			}
		}
		if (minutes !== null) {
			if (minutes < 0) {
				before = !before;
				minutes = -minutes;
			}
			if (!before) {
				minutes = -minutes;
			}
			input_value = Math.abs(minutes);
		}
		if (minutes != 0 && !empty) {
			before = minutes >= 0;
		}
		setTimeout(() => {
			dispatch('confirm');
		}, 500);
	}
</script>

<div class="container">
	<input
		type="text"
		min="0"
		bind:value={input_value}
		on:blur={confirm}
		on:keypress={(evt) => {
			if (evt.key == 'Enter') {
				confirm();
			}
		}}
	/>
	<span> minutes </span>
	<div class="beforeafter">
		<label>
			<input type="radio" bind:group={before} value={true} on:change={confirm} />
			before
		</label>
		<label>
			<input type="radio" bind:group={before} value={false} on:change={confirm} />
			after (if sleep not started)
		</label>
	</div>
	{#if !empty}
		<button
			class="link delete"
			on:click={(evt) => {
				minutes = null;
				empty = false;
				input_value = '';
				dispatch('confirm');
			}}
		>
			<Delete />
		</button>
	{/if}
</div>

<style>
	.container {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		justify-content: flex-start;
    align-items: center;
		gap: 10px;
	}

	input[type='text'] {
		width: 150px;
		flex: 0 0;
	}

	.beforeafter {
		flex: 0 0 auto;
	}

	button :global(svg) {
		fill: currentColor;
		vertical-align: -4px;
	}
</style>
