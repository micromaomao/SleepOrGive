<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Delete from '@fluentui/svg-icons/icons/delete_20_regular.svg?component';
	import { parseTime } from '$lib/textutils';

	const dispatch = createEventDispatcher();

	export let minutes: number | null;
	export let empty: boolean;

	export let sleepTarget: string;
	let parsedTarget: [number, number, number];
	$: parsedTarget = parseTime(sleepTarget);

	function offsetToTime(minutes: number): string {
		let t = parsedTarget[0] * 60 + parsedTarget[1];
		t += minutes;
		if (t < 0) {
			t += 24 * 60;
		}
		if (t >= 24 * 60) {
			t -= 24 * 60;
		}
		let h = Math.floor(t / 60);
		let m = t % 60;
		return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
	}

	function timeToOffset(time: string): number {
		let parsed = parseTime(time);
		let t = parsed[0] * 60 + parsed[1];
		let targetT = parsedTarget[0] * 60 + parsedTarget[1];
		let offset = t - targetT;
		if (offset < -12 * 60) {
			offset += 24 * 60;
		}
		if (offset > 12 * 60) {
			offset -= 24 * 60;
		}
		return offset;
	}

	let input_value: string = '';
	$: if (!empty && parsedTarget) {
		input_value = offsetToTime(minutes);
	}

	let confirmDispatchTimeout = null;

	function confirm(evt: Event) {
		let parsedInput: [number, number, number];
		input_value = (evt.target as HTMLInputElement).value;
		try {
			parsedInput = parseTime(input_value);
		} catch (e) {
			minutes = null;
			empty = true;
			return;
		}
		minutes = timeToOffset(input_value);
		empty = false;
		input_value = offsetToTime(minutes);
		if (confirmDispatchTimeout !== null) {
			clearTimeout(confirmDispatchTimeout);
		}
		confirmDispatchTimeout = setTimeout(() => {
			confirmDispatchTimeout = null;
			dispatch('confirm');
		}, 500);
	}
</script>

<div class="container">
	<input
		type="time"
		value={input_value}
		on:blur={confirm}
		on:change={confirm}
		on:keypress={(evt) => {
			if (evt.key == 'Enter') {
				// @ts-ignore
				confirm(evt.target.value);
			}
		}}
	/>
	<span class="desc">
		{#if !empty && input_value === offsetToTime(minutes)}
			({#if minutes < 0}
				{-minutes} minutes before
			{:else if minutes > 0}
				{minutes} minutes after
			{:else}
				at
			{/if}
			target time)
		{/if}
	</span>
	{#if !empty}
		<button
			class="link delete"
			on:click={(evt) => {
				minutes = null;
				empty = false;
				input_value = '';
				if (confirmDispatchTimeout) {
					clearTimeout(confirmDispatchTimeout);
					confirmDispatchTimeout = null;
				}
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

	input {
		width: 150px;
		flex-grow: 0;
		flex-shrink: 0;
	}

	.desc,
	button {
		flex-grow: 0;
		flex-shrink: 0;
	}

	button :global(svg) {
		fill: currentColor;
		vertical-align: -4px;
	}
</style>
