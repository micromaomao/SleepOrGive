import { browser } from '$app/environment';
import { getContext, setContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';

const CONTEXT_KEY = Symbol('auth context key');
const LOCALSTORAGE_BEARER_KEY = 'session_bearer';

class AuthContext {
	constructor(
		public readonly bearer: string | null,
		public readonly user_id: string | null = null,
		public readonly username: string | null = null
	) {}

	get isAuthenticated(): boolean {
		return this.bearer != null;
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
		}).then(async (r) => {
			if (!r.ok) {
				store.update((old) => {
					if (old.bearer != initialContext.bearer) {
						return old;
					}
					return new AuthContext(null);
				});
				return;
			}
			let json = await r.json();
			store.update((old) => {
				if (old.bearer != initialContext.bearer) {
					return old;
				}
				return new AuthContext(initialContext.bearer, json.user_id, json.username);
			});
		});
	}
}

export function initAuthContext() {
	let store = writable<AuthContext>(undefined);
	createInitContext(store);
	setContext(CONTEXT_KEY, store);
}

export function useAuthContext(): Writable<AuthContext> {
	return getContext(CONTEXT_KEY);
}

export function reset(ctx: Writable<AuthContext>) {
	createInitContext(ctx);
}
