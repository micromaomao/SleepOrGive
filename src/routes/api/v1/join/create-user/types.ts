import type { UserSettings } from '$lib/shared_types';

export interface CreateUserAPIBody extends UserSettings {
	emailVerificationClientTicket: string;
	emailVerificationCode: string;
}
