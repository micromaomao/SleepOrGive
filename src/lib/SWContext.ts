import { browser } from '$app/environment';
import type { Subscriber, Unsubscriber } from 'svelte/store';
import { subscribeAuthContext, AuthContext } from './AuthenticationContext';

class SWContext {
	public browserSupport: boolean = false;
	public pushPermissionState: PermissionState = 'prompt';

	private unsubscribeAuthContext: (() => void) | null = null;
	private swRegistration: ServiceWorkerRegistration | null = null;
	private pushSubscription: PushSubscription | null = null;
	private authContext: AuthContext | null = null;

	private subscribers = new Set<Subscriber<SWContext>>();

	constructor() {
		this.browserSupport = 'serviceWorker' in window.navigator && 'PushManager' in window;
		if (!this.browserSupport) {
			return;
		}

		this.handleAuthContextChange = this.handleAuthContextChange.bind(this);
		this.unsubscribeAuthContext = subscribeAuthContext(this.handleAuthContextChange);
	}

	subscribe(fn: Subscriber<SWContext>): Unsubscriber {
		this.subscribers.add(fn);
		fn(this);
		return () => {
			this.subscribers.delete(fn);
		};
	}

	private notify() {
		for (const fn of this.subscribers) {
			fn(this);
		}
	}

	async registerServiceWorker() {
		if (!this.browserSupport) {
			return;
		}

		try {
			// This will not work in development on Firefox!
			// https://kit.svelte.dev/docs/service-workers#during-development
			this.swRegistration = await navigator.serviceWorker.register('/service-worker.js', {
				type: 'module'
			});
			if (!this.swRegistration) {
				throw new Error('Service worker registration failed');
			}
			this.pushPermissionState = await this.swRegistration.pushManager.permissionState({
				userVisibleOnly: true
			});
		} catch (e) {
			console.error(e);
			this.browserSupport = false;
			throw e;
		} finally {
			this.notify();
		}
	}

	async updateSubscriptions() {
		if (!this.browserSupport || !this.swRegistration) {
			return;
		}
		if (this.authContext.bearer) {
			this.pushSubscription = await this.swRegistration.pushManager.getSubscription();
		}
		this.notify();
	}

	async handleAuthContextChange(authContext: AuthContext) {
		this.authContext = authContext;
		try {
			await this.updateSubscriptions();
		} catch (e) {
			console.error(e);
			// TODO
		} finally {
			this.notify();
		}
	}
}

let instance: SWContext | null = null;
if (browser) {
	instance = new SWContext();
	if (!instance.browserSupport) {
		console.log('Browser does not support service workers');
	} else {
		instance
			.registerServiceWorker()
			.then(async () => {
				console.log('Service worker registered');
				await instance.updateSubscriptions();
			})
			.catch((e) => {
				console.error('Error registering service worker');
				console.error(e);
			});
	}
}

export function getServiceWorkerContext(): SWContext {
	if (!browser) {
		throw new Error('Not available on server side');
	}
	return instance;
}
