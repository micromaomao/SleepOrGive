<script lang="ts">
	import { parseTime } from '$lib/textutils';
	import { onMount } from 'svelte';
	import interact from 'interactjs';

	export let targetTime: string;

	const min_h = 21;
	const max_h = 3;
	const len = (max_h + 24 - min_h) * 60;
	function unitToTime(u: number): string {
		u = Math.round(u);
		let h = Math.floor(u / 60) + min_h;
		let m = u % 60;
		if (h >= 24) h -= 24;
		return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
	}
	function timeToUnit(t: string): number {
		let [h, m, _] = parseTime(t);
		if (h < min_h) h += 24;
		return (h - min_h) * 60 + m;
	}
	const ticks_1 = [
		timeToUnit('21:00'),
		timeToUnit('22:00'),
		timeToUnit('23:00'),
		timeToUnit('00:00'),
		timeToUnit('01:00'),
		timeToUnit('02:00')
	];
	const ticks_2 = [timeToUnit('22:00'), timeToUnit('00:00'), timeToUnit('02:00')];

	let window_width = window.innerWidth;
	$: ticks = window_width < 600 ? ticks_2 : ticks_1;

	function unitToScale(u: number): string {
		return `${(u / len) * 100}%`;
	}

	let slider: HTMLDivElement;
	let slide: HTMLDivElement;

	onMount(() => {
		interact(slider).draggable({
			origin: slider,
			modifiers: [
				interact.modifiers.restrict({
					restriction: slider
				})
			],
			listeners: {
				move(evt) {
					let x = (evt.pageX / slider.offsetWidth) * len;
					x = Math.max(0, Math.min(len, Math.round(x)));
					x = Math.round(x / 5) * 5;
					targetTime = unitToTime(x);
				}
			}
		});
	});

	function handleChangeInput(evt) {
		try {
			let t = timeToUnit(evt.target.value);
			if (t > len) {
				if (t > len + 10 * 60) {
					t = 0;
				} else {
					t = len;
				}
			}
			targetTime = unitToTime(t);
			evt.target.value = targetTime;
		} catch (e) {}
	}

	function handleBlur(evt) {
		evt.target.value = targetTime;
	}
</script>

<div class="container">
	<div class="slider" bind:this={slider}>
		<div class="bg" />
		{#each ticks as tick}
			<div
				class="ticktext"
				class:zerotick={tick == timeToUnit('00:00')}
				style={`left: ${unitToScale(tick)};`}
			>
				{unitToTime(tick)}
			</div>
			<div
				class="tick"
				class:zerotick={tick == timeToUnit('00:00')}
				style={`left: ${unitToScale(tick)};`}
			/>
		{/each}
		<div class="slide" style={`left: ${unitToScale(timeToUnit(targetTime))}`} bind:this={slide} />
	</div>
	<div class="text">
		<input type="time" value={targetTime} on:input={handleChangeInput} on:blur={handleBlur} />
	</div>
</div>

<svelte:window on:resize={() => (window_width = window.innerWidth)} />

<style lang="scss">
	.container {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		width: 100%;
		align-items: center;
		padding: 10px 0;
	}

	.slider {
		flex-grow: 1;
		flex-shrink: 1;
		height: 10px;
		position: relative;
		overflow: visible;
		cursor: move;
	}

	.bg {
		height: 2px;
		position: absolute;
		left: 0;
		right: 0;
		top: 4px;
		background: linear-gradient(
			to right,
			var(--color-light-gray) 0%,
			var(--color-primary) 50%,
			var(--color-light-gray) 100%
		);
	}

	.text {
		flex-grow: 0;
		flex-shrink: 0;
		width: min-content;
		padding-left: 8px;
		text-align: center;
		font-size: 16px;
		font-weight: bold;
	}

	.ticktext {
		position: absolute;
		bottom: 17px;
		transform: translateX(-50%);
		font-size: 12px;
		color: var(--color-gray);
		pointer-events: none;
		user-select: none;

		&.zerotick {
			bottom: 19px;
			font-size: 16px;
			color: var(--color-primary);
		}
	}

	.tick {
		position: absolute;
		top: -1px;
		width: 2px;
		transform: translateX(-1px);
		height: 12px;
		background-color: var(--color-light-gray);

		&.zerotick {
			background-color: var(--color-primary);
		}
	}

	.slide {
		position: absolute;
		top: -5px;
		width: 20px;
		transform: translateX(-50%);
		height: 20px;
		border-radius: 50%;
		background-color: var(--color-primary);
	}
</style>
