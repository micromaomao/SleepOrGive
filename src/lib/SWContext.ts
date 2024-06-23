import { browser, dev } from '$app/environment';
import type { Readable, Subscriber, Unsubscriber } from 'svelte/store';
import { AuthContext, authContextStore } from './AuthenticationContext';
import { maybeShowLocalPersistentAlert, showTransientAlert } from '../routes/UserNotices.svelte';
import JustText from './components/JustText.svelte';

class SWContext implements Readable<SWContext> {
	public browserSupport: boolean = false;
	public pushPermissionState: PermissionState = 'prompt';
	public updateError: Error | null = null;

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
		this.unsubscribeAuthContext = authContextStore.subscribe(this.handleAuthContextChange);
	}

	subscribe(fn: Subscriber<SWContext>): Unsubscriber {
		this.subscribers.add(fn);
		fn(this);
		return () => {
			this.subscribers.delete(fn);
		};
	}

	notify() {
		for (const fn of this.subscribers) {
			fn(this);
		}
	}

	private async updatePermissionState() {
		this.pushPermissionState = await this.swRegistration.pushManager.permissionState({
			userVisibleOnly: true
		});
		this.notify();
	}

	async registerServiceWorker() {
		if (!this.browserSupport) {
			return;
		}

		try {
			// This will not work in development on Firefox (but will in production)!
			// https://kit.svelte.dev/docs/service-workers#during-development
			this.swRegistration = await navigator.serviceWorker.register('/service-worker.js', {
				type: 'module'
			});
			if (!this.swRegistration) {
				throw new Error('Service worker registration failed');
			}
			await this.updatePermissionState();
		} catch (e) {
			console.error(e);
			this.browserSupport = false;
			throw e;
		} finally {
			this.notify();
		}
	}

	async updateSubscriptions() {
		if (!this.browserSupport || !this.swRegistration || !this.authContext) {
			return;
		}
		if (this.authContext.bearer) {
			this.pushSubscription = await this.swRegistration.pushManager.getSubscription();
			// TODO
		}
		this.notify();
	}

	async handleAuthContextChange(authContext: AuthContext) {
		this.authContext = authContext;
		try {
			await this.updateSubscriptions();
		} catch (e) {
			console.error(e);
			// TODO: show error to user
		} finally {
			this.notify();
		}
	}

	async promptPermission() {
		if (!this.browserSupport || !this.swRegistration) {
			throw new Error('Service worker not registered');
		}
		await Notification.requestPermission();
		await this.updatePermissionState();
	}
}

let instance: SWContext | null = null;
if (browser) {
	instance = new SWContext();
	if (!instance.browserSupport) {
		maybeShowLocalPersistentAlert({
			dismiss_key: 'push_not_supported',
			intent: 'error',
			component: JustText,
			props: {
				text: 'Your browser does not support push notifications - sleep reminders will not show on this device.'
			}
		});
	} else {
		instance
			.registerServiceWorker()
			.then(
				async () => {
					console.log('Service worker registered');
					try {
						await instance.updateSubscriptions();
					} catch (err) {
						maybeShowLocalPersistentAlert({
							dismiss_key: 'push_not_supported',
							intent: 'error',
							component: JustText,
							props: {
								text: `Unable to update push notification subscriptions - reminders may not work on this browser.`
							}
						});
						throw err;
					}
				},
				(err) => {
					let text = 'Sleep reminders will not work on this browser as we could not set up push notification (ServiceWorker registration failed).';
					if (dev) {
						text = `ServiceWorker registration failed: ${err}\nNote that Firefox does not support ES module service workers and therefore this is expected to not work in dev on Firefox.`;
					}
					maybeShowLocalPersistentAlert({
						dismiss_key: 'push_not_supported',
						intent: 'error',
						component: JustText,
						props: {
							text
						}
					});
					throw err;
				}
			)
			.catch((e) => {
				console.error(e);
				instance.updateError = e;
				instance.notify();
			});
	}
}

export function getServiceWorkerContext(): SWContext {
	if (!browser) {
		throw new Error('Not available on server side');
	}
	return instance;
}
