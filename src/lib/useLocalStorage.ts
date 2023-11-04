import { browser } from '$app/environment';
import { onMount } from 'svelte';
import { writable, type Subscriber, type Writable, get } from 'svelte/store';
import { tryValidate } from './utils';

const localStorageSubscriptions: Map<string, Set<Subscriber<unknown>>> = new Map();

export function useLocalStorage<T>(key: string, initialValue: T): Writable<T> & { get(): T } {
	if (!browser) {
		let store: any = writable(initialValue);
		store.get = () => get(store);
		return store;
	}
	let obj = {
		set(value: T) {
			window.localStorage.setItem(key, JSON.stringify(value));
			if (localStorageSubscriptions.has(key)) {
				for (let fn of localStorageSubscriptions.get(key)) {
					fn(value);
				}
			}
		},
		update(updater: (old: T) => T) {
			obj.set(updater(obj.get()));
		},
		get(): T {
			return JSON.parse(window.localStorage.getItem(key)) ?? initialValue;
		},
		subscribe(run: Subscriber<T>) {
			if (!localStorageSubscriptions.has(key)) {
				localStorageSubscriptions.set(key, new Set());
			}
			localStorageSubscriptions.get(key).add(run);
			run(obj.get());
			return () => {
				localStorageSubscriptions.get(key).delete(run);
			};
		}
	};
	return obj;
}

if (browser) {
	window.addEventListener('storage', (evt) => {
		let subscriptions = localStorageSubscriptions.get(evt.key);
		let newValue = JSON.parse(evt.newValue);
		if (!subscriptions) return;
		for (let fn of subscriptions) {
			fn(newValue);
		}
	});
}

const emailVerificationCodeStore = useLocalStorage<'expecting' | string | null>(
	'email_verification_code',
	null
);

export function useEmailVerificationCodeAutofill(fill: (code: string) => void) {
	if (!browser) return;
	onMount(() => {
		emailVerificationCodeStore.set('expecting');
		let unsubscribe = emailVerificationCodeStore.subscribe((code) => {
			if (/^\d{6}$/.test(code)) {
				fill(code);
				emailVerificationCodeStore.set('expecting');
			}
		});
		return () => {
			unsubscribe();
			emailVerificationCodeStore.set(null);
		};
	});
}

export function provideEmailVerificationCode(code: string): boolean {
	if (!browser) return false;
	let used = false;
	emailVerificationCodeStore.update((original_value) => {
		if (original_value == 'expecting') {
			used = true;
			return code;
		}
		return original_value;
	});
	return used;
}
