import { browser } from '$app/environment';
import { getContext, setContext } from 'svelte';
import { get, writable, type Readable, type Writable } from 'svelte/store';
import type { UserData } from './shared_types';

const CONTEXT_KEY = Symbol('auth context key');
const LOCALSTORAGE_BEARER_KEY = 'session_bearer';

class AuthContext {
	constructor(
		public readonly bearer: string | null,
		public readonly user_id: string | null = null,
		public readonly username: string | null = null,
		public readonly timezone: string | null = null
	) {}

	get isAuthenticated(): boolean {
		return this.bearer != null;
	}

	fetch(path: string, init?: RequestInit): Promise<any> {
		return fetch(path, {
			...init,
			headers: {
				Accept: 'application/json',
				...(init?.headers ?? {}),
				Authorization: this.isAuthenticated ? `Bearer ${this.bearer}` : undefined
			}
		}).then(async (res) => {
			if (!res.ok) {
				let json = await res.json();
				throw new Error(`${res.status} ${json.message}`);
			} else {
				return res;
			}
		});
	}
}

function createInitContext(store: Writable<AuthContext>) {
	let initialContext = new AuthContext(null);

	if (browser) {
		let bearer = window.localStorage.getItem(LOCALSTORAGE_BEARER_KEY);
		if (bearer) {
			initialContext = new AuthContext(bearer);
		}
	}

	store.set(initialContext);

	if (browser && initialContext.bearer) {
		fetch('/api/v1/user/me', {
			headers: { Authorization: `Bearer ${initialContext.bearer}` }
		}).then(
			async (r) => {
				if (!r.ok) {
					store.update((old) => {
						if (old.bearer != initialContext.bearer) {
							return old;
						}
						return new AuthContext(null);
					});
					return;
				}
				let json: UserData = await r.json();
				store.update((old) => {
					if (old.bearer != initialContext.bearer) {
						return old;
					}
					return new AuthContext(initialContext.bearer, json.user_id, json.username, json.timezone);
				});
			},
			(err) => {
				console.error(err);
				setTimeout(() => {
					if (get(store).bearer == initialContext.bearer) {
						reset(store);
					}
				}, 1000);
			}
		);
	}
}

let globalStoreReference: Writable<AuthContext> | null = null;
if (browser) {
	globalStoreReference = writable(undefined);
	createInitContext(globalStoreReference);
}

export function initAuthContext(): Writable<AuthContext> {
	let store: Writable<AuthContext>;
	if (browser) {
		store = globalStoreReference;
	} else {
		store = writable<AuthContext>(undefined);
		createInitContext(store);
	}
	setContext(CONTEXT_KEY, store);
	return store;
}

export function useAuthContext(): Writable<AuthContext> {
	return getContext(CONTEXT_KEY);
}

export function reset(ctx: Writable<AuthContext>, logout: boolean = true) {
	window.localStorage.removeItem(LOCALSTORAGE_BEARER_KEY);
	createInitContext(ctx);
}

export function getAuthContext(): AuthContext {
	if (!browser) {
		throw new Error('Not available on server side');
	}
	if (!globalStoreReference) {
		throw new Error('AuthContext not initialized');
	}
	return get(globalStoreReference);
}
