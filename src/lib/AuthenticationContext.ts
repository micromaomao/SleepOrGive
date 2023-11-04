import { browser } from '$app/environment';
import { getContext, setContext } from 'svelte';
import { get, writable, type Readable, type Writable, type Unsubscriber } from 'svelte/store';
import type { UserData } from './shared_types';
import { useLocalStorage } from './useLocalStorage';

const CONTEXT_KEY = Symbol('auth context key');
const authTokenStore: Writable<string | null> | null = browser
	? useLocalStorage('session_bearer', null)
	: null;
export const authContextStore: Writable<AuthContext> | null = browser ? writable(null) : null;

export class AuthContext {
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
				...(this.isAuthenticated ? { Authorization: `Bearer ${this.bearer}` } : {})
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

function createInitContext(contextStore: Writable<AuthContext>) {
	let initialContext = new AuthContext(null);

	if (authTokenStore) {
		let previousAbortController: AbortController | null = null;

		let unsubscribe = authTokenStore.subscribe(async (bearer) => {
			if (previousAbortController) {
				previousAbortController.abort();
				previousAbortController = null;
			}
			if (bearer) {
				initialContext = new AuthContext(bearer);
			}
			let abortController = new AbortController();
			previousAbortController = abortController;
			try {
				let r = await fetch('/api/v1/user/me', {
					headers: { Authorization: `Bearer ${initialContext.bearer}` },
					signal: abortController.signal
				});
				if (abortController.signal.aborted) {
					return;
				}
				if (!r.ok) {
					contextStore.set(new AuthContext(null));
					// TODO: show error to user...?
					return;
				}
				let json: UserData = await r.json();
				if (abortController.signal.aborted) {
					return;
				}
				contextStore.set(
					new AuthContext(initialContext.bearer, json.user_id, json.username, json.timezone)
				);
			} catch (err) {
				if (abortController.signal.aborted) {
					return;
				}
				console.error(err);
				setTimeout(() => {
					if (abortController.signal.aborted) {
						return;
					}
					authTokenStore.update((b) => b);
				}, 1000);
			}
		});
	}

	contextStore.set(initialContext);
}

export function initAuthContext(): Writable<AuthContext> {
	let store = authContextStore ?? writable(null);
	createInitContext(store);
	setContext(CONTEXT_KEY, store);
	return store;
}

export function useAuthContext(): Writable<AuthContext> {
	return getContext(CONTEXT_KEY);
}

export function refreshAuthContext() {
	if (!browser) {
		throw new Error('Not available on server side');
	}
	authTokenStore.update((b) => b);
}

export function storeNewToken(bearer: string, initialInfo: AuthContext = null) {
	if (!initialInfo) {
		initialInfo = new AuthContext(bearer);
	}
	authContextStore.set(initialInfo);
	authTokenStore.set(bearer);
}

export function logout() {
	if (!browser) {
		throw new Error('Not available on server side');
	}
	authTokenStore.set(null);
}

export function getAuthContext(): AuthContext {
	if (!browser) {
		throw new Error('Not available on server side');
	}
	return get(authContextStore);
}
