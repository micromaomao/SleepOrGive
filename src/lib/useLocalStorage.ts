import { browser } from '$app/environment';
import { writable, type Subscriber, type Writable, get } from 'svelte/store';

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
