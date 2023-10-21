<script lang="ts" context="module">
	import { writable } from 'svelte/store';

	export interface TransientAlert {
		intent: 'error' | 'info';
		message: string;
	}

	export const transientAlerts = writable<TransientAlert[]>([]);

	export function showTransientAlert(alert: TransientAlert) {
		transientAlerts.update((alerts) => [...alerts, alert]);
	}

	export function dismissTransientAlert(alert: TransientAlert) {
		transientAlerts.update((alerts) => alerts.filter((a) => a !== alert));
	}

	showTransientAlert({
		intent: 'info',
		message: 'This is an info message.'
	});
</script>

<script lang="ts">
	import Alert from '$lib/components/Alert.svelte';
	import CloseButton from '$lib/components/CloseButton.svelte';
	import { flip } from 'svelte/animate';
	import { cubicInOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';
</script>

{#each $transientAlerts as alert (alert)}
	<div
		animate:flip={{ duration: 200, easing: cubicInOut }}
		transition:fade={{ duration: 200, easing: cubicInOut }}
	>
		<Alert intent={alert.intent} style="margin: 0;">
			{alert.message}

			<span slot="actions">
				<CloseButton on:click={() => dismissTransientAlert(alert)} />
			</span>
		</Alert>
	</div>
{/each}
