import { onMount } from 'svelte';

export function tryValidate(validation_fn: (val: string) => void, val: string): string | null {
	try {
		validation_fn(val);
		return null;
	} catch (e) {
		return e.message ?? e.body?.message ?? e.toString();
	}
}

export function useHideScrollbars(): (hide: boolean) => void {
	function hideScrollBars() {
		document.documentElement.style.overflow = 'hidden';
		document.body.style.overflow = 'hidden';
	}

	function unhideScrollBars() {
		document.documentElement.style.overflow = '';
		document.body.style.overflow = '';
	}

	onMount(() => {
		return () => {
			unhideScrollBars();
		};
	});

	return (hide) => {
		if (hide) {
			hideScrollBars();
		} else {
			unhideScrollBars();
		}
	};
}
