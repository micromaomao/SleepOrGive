// See https://kit.svelte.dev/docs/types#app

import type { AuthenticatedUserInfo } from '$lib/server/auth';

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: AuthenticatedUserInfo;
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
