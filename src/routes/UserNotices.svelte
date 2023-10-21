<script lang="ts" context="module">
	import { writable } from 'svelte/store';

	export interface TransientAlert {
		intent: 'error' | 'info';
		message: string;
	}
	export interface ExplicitDismissAlert {
		intent: 'error' | 'info';
		message: string;
		dismiss_key: string;
	}
	type Notice =
		| ({ type: 'transient' } & TransientAlert)
		| ({ type: 'explicit_dismiss_local' } & ExplicitDismissAlert);

	export const allNotices = writable<Notice[]>([]);

	const localDismissStore = useLocalStorage<string[]>('localDismissedNotices', []);

	export function showTransientAlert(alert: TransientAlert) {
		allNotices.update((notices) => [...notices, { type: 'transient', ...alert }]);
	}

	function removeDismissed() {
		let dismissedKeys = localDismissStore.get();
		allNotices.update((notices) =>
			notices.filter((n) => {
				if (n.type == 'explicit_dismiss_local') {
					return !dismissedKeys.includes(n.dismiss_key);
				} else {
					return true;
				}
			})
		);
	}

	localDismissStore.subscribe((keys) => {
		removeDismissed();
	});

	export function maybeShowLocalPersistentAlert(alert: ExplicitDismissAlert) {
		allNotices.update((notices) => [...notices, { type: 'explicit_dismiss_local', ...alert }]);
		removeDismissed();
	}

	export function dismiss(notice: Notice) {
		allNotices.update((notices) => notices.filter((n) => n !== notice));
		if (notice.type == 'explicit_dismiss_local') {
			localDismissStore.update((keys) => [...keys, notice.dismiss_key]);
		}
	}
</script>

<script lang="ts">
	import Alert from '$lib/components/Alert.svelte';
	import CloseButton from '$lib/components/CloseButton.svelte';
	import { flip } from 'svelte/animate';
	import { cubicInOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';
	import { useLocalStorage } from '$lib/useLocalStorage';
</script>

{#each $allNotices as notice (notice)}
	<div
		animate:flip={{ duration: 200, easing: cubicInOut }}
		transition:fade={{ duration: 200, easing: cubicInOut }}
	>
		<Alert intent={notice.intent} style="margin: 0;">
			{notice.message}

			<span slot="actions">
				{#if notice.type == 'transient'}
					<CloseButton on:click={() => dismiss(notice)} />
				{:else if notice.type == 'explicit_dismiss_local'}
					<button class="link" on:click={() => dismiss(notice)}>Don't show again</button>
				{/if}
			</span>
		</Alert>
	</div>
{/each}
