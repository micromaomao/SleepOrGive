<script lang="ts" context="module">
	import { writable } from 'svelte/store';
	import { useLocalStorage } from '$lib/useLocalStorage';

	export interface NoticeContent<P extends object> {
		intent: 'error' | 'info';
		component: typeof SvelteComponent<P>;
		props: P;
	}

	export interface TransientAlert<P extends object> extends NoticeContent<P> {
		key?: string;
	}
	export interface ExplicitDismissAlert<P extends object> extends NoticeContent<P> {
		dismiss_key: string;
	}
	type Notice<P extends object> =
		| ({ type: 'transient' } & TransientAlert<P>)
		| ({ type: 'explicit_dismiss_local' } & ExplicitDismissAlert<P>);

	export const allNotices = writable<Notice<any>[]>([]);

	const localDismissStore = useLocalStorage<string[]>('localDismissedNotices', []);

	export function showTransientAlert<P extends object>(alert: TransientAlert<P>) {
		if (alert.key !== undefined && alert.key !== null) {
			allNotices.update((notices) =>
				notices.filter((n) => n.type != 'transient' || n.key !== alert.key)
			);
		}
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

	export function maybeShowLocalPersistentAlert<P extends object>(alert: ExplicitDismissAlert<P>) {
		allNotices.update((notices) => [
			...notices.filter(
				(n) => !(n.type == 'explicit_dismiss_local' && n.dismiss_key == alert.dismiss_key)
			),
			{ type: 'explicit_dismiss_local', ...alert }
		]);
		removeDismissed();
	}

	export function dismiss(notice: Notice<any>) {
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
	import type { SvelteComponent } from 'svelte';
</script>

<div>
	<div class="alpha-banner">
		<b class="alpha">ALPHA</b>
		Thanks for checking this out! This is a work in progress and most features does not work yet.
	</div>
</div>

{#each $allNotices as notice (notice)}
	<div
		animate:flip={{ duration: 200, easing: cubicInOut }}
		transition:fade={{ duration: 200, easing: cubicInOut }}
	>
		<Alert intent={notice.intent} style="margin: 0;">
			<svelte:component this={notice.component} {...notice.props} />

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

<style>
	.alpha-banner {
		background-color: #d8efff;
		padding: 10px 15px;
		display: flex;
		flex-direction: row;
		align-items: baseline;
	}

	.alpha {
		margin: 0 15px 0 0;
		display: inline-block;
		padding: 2px 5px;
		background-color: var(--color-primary);
		color: white;
	}
</style>
