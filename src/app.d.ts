// See https://kit.svelte.dev/docs/types#app

import type { AuthenticatedUserInfo } from '$lib/server/auth';

// for information about these interfaces
declare global {
	namespace App {
		interface Error {
			message: string;
			requireNewCode?: boolean;
		}
		interface Locals {
			user: AuthenticatedUserInfo;
		}
		interface PageData {
			title?: string;
			is_admin_page?: boolean;
		}
		// interface Platform {}
	}
}

export {};
