<script lang="ts">
	export let intent: 'success' | 'info' | 'error' = 'error';
	export let hasRetry: boolean = false;
	export let style: string = undefined;

	import ErrorCircle from '@fluentui/svg-icons/icons/error_circle_16_regular.svg?component';
	import Info from '@fluentui/svg-icons/icons/info_16_regular.svg?component';
	import CheckmarkCircle from '@fluentui/svg-icons/icons/checkmark_circle_16_regular.svg?component';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function handleRetry() {
		dispatch('retry');
	}
</script>

<div class={'alert ' + intent} {style}>
	<span class="icon">
		{#if intent === 'error'}
			<ErrorCircle />
		{/if}
		{#if intent == 'info'}
			<Info />
		{/if}
		{#if intent == 'success'}
			<CheckmarkCircle />
		{/if}
	</span>

	<span class="text">
		<slot />
	</span>

	{#if hasRetry}
		<button class="link retry" on:click={handleRetry}>Retry</button>
	{/if}
	<slot name="actions" />
</div>

<style>
	.alert {
		padding: 10px 15px;
		margin: 5px;
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	.success {
		background-color: #d4edda;
		color: #155724;
	}

	.info {
		background-color: #d1ecf1;
		color: #0c5460;
	}

	.error {
		background-color: #f8d7da;
		color: #721c24;
	}

	.alert :global(svg) {
		fill: currentColor;
	}

	.icon {
		flex-shrink: 0;
		flex-grow: 0;
	}

	.icon :global(svg) {
		vertical-align: -2px;
	}

	.alert > :global(*) {
		flex-grow: 0;
		flex-shrink: 0;
	}

	.text {
		margin-left: 5px;
		margin-right: auto;
		flex-grow: 1;
		flex-shrink: 1;
	}
</style>
