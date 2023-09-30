import { browser } from '$app/environment';
import { getContext, setContext } from 'svelte';
import { get, writable, type Readable, type Writable } from 'svelte/store';
import { Zone, SystemZone, IANAZone } from 'luxon';

const CONTEXT_KEY = Symbol('timezone context key');

export class TimezoneContext {
	constructor(public readonly zone: Zone) {}

	static fromZoneName(zoneName: string): TimezoneContext {
		return new TimezoneContext(IANAZone.create(zoneName));
	}
}

function createInitContext(store: Writable<TimezoneContext>) {
	let initialContext = new TimezoneContext(new SystemZone());
	store.set(initialContext);
}

let globalStoreReference: Writable<TimezoneContext> | null = null;
if (browser) {
	globalStoreReference = writable(undefined);
	createInitContext(globalStoreReference);
}

export function newTimezoneContext(override?: TimezoneContext): Readable<TimezoneContext> {
	if (override) {
		let store = writable<TimezoneContext>(override);
		setContext(CONTEXT_KEY, store);
		return store;
	} else {
		let store: Writable<TimezoneContext>;
		if (browser) {
			store = globalStoreReference;
		} else {
			store = writable<TimezoneContext>(undefined);
			createInitContext(store);
			setContext(CONTEXT_KEY, store);
		}
		return store;
	}
}

export function useTimezoneContext(): Readable<TimezoneContext> {
	return getContext(CONTEXT_KEY);
}

export function getTimezoneContext(): TimezoneContext {
	if (!browser) {
		throw new Error('Not available on server side');
	}
	if (!globalStoreReference) {
		throw new Error('AuthContext not initialized');
	}
	return get(globalStoreReference);
}
