<script lang="ts" context="module">
	import Spinner from '$lib/components/Spinner.svelte';
	import { getContext, setContext } from 'svelte';
	import { writable, type Readable, type Writable } from 'svelte/store';
	export const ContextKey = Symbol('NextPrev:ContextKey');
	export interface Context {
		hasPrev?: boolean;
		overrideNext?: string;
		overrideBack?: string;
		onBack: () => void;
		onNext: () => void;
	}

	export function initNextPrevContext(context: Context) {
		let store = writable(context);
		setContext(ContextKey, store);
		return store;
	}
	export function useNextPrevContext(): Readable<Context> {
		const context = getContext<Writable<Context>>(ContextKey);
		if (context === undefined) {
			throw new Error('NextPrev: No context found');
		}
		return context;
	}
</script>

<script lang="ts">
	export let nextDisabled: boolean = false;
	export let overrideNext: string | undefined = undefined;

	const context = useNextPrevContext();
	$: hasPrev = $context.hasPrev ?? true;
	$: nextStr = overrideNext ?? $context.overrideNext ?? 'Next';
	$: backStr = $context.overrideBack ?? 'Back';
	$: onBack = $context.onBack;
	$: onNext = $context.onNext;

	export let validationGate: (() => Promise<void>) | null = null;
	let validationCancel: AbortController | null = null;
	let hasValidationError: boolean = false;
	function ensureCancelValidation() {
		if (validationCancel) {
			validationCancel.abort();
			validationCancel = null;
		}
		hasValidationError = false;
	}
	$: validationGate, ensureCancelValidation();
</script>

<div class="nextprev">
	{#if hasPrev}
		<!-- Using a here because using button causes form submit to click the "back" button -->
		<a
			tabindex="0"
			role="button"
			class="back"
			on:click={(evt) => {
				ensureCancelValidation();
				onBack();
			}}
			on:keydown={(evt) => {
				if (evt.key == 'Enter') {
					ensureCancelValidation();
					onBack();
				}
			}}>{backStr}</a
		>
	{/if}
	{#if validationCancel === null}
		<input
			type="submit"
			class="next primary"
			value={nextStr}
			disabled={nextDisabled}
			on:click={async (evt) => {
				evt.preventDefault();
				if (validationGate) {
					ensureCancelValidation();
					let cancel = new AbortController();
					validationCancel = cancel;
					try {
						await validationGate();
						if (cancel.signal.aborted) {
							return;
						}
					} catch (e) {
						if (cancel.signal.aborted) {
							return;
						}
						hasValidationError = true;
					}
					validationCancel = null;
				}
				if (!hasValidationError) {
					onNext();
				}
			}}
		/>
	{:else}
		<button class="next primary spinning" disabled>
			<Spinner />
			{nextStr}
		</button>
	{/if}
</div>

<style lang="scss">
	@import './shared.scss';

	.spinning {
		cursor: progress;
	}
</style>
