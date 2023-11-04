export interface BasicUserData {
	username: string | null;
	user_id: string;
	timezone: string;
}
export interface UserData extends BasicUserData {
	sleep_data: {
		currentMonth: number;
		currentYear: number;
	};
}

export interface UserSettings {
	username?: string | null;
	email: string;
	timezone: string;
	profileIsPublic: boolean;
	sleepTargetTime: string;
	donationAmount: string;
	currency: string;
	sleepNotificationTimeOffsets: number[];
}

export interface UserAuthConfig {
	// Nothing yet
}

export interface AuthAttemptState {
	email_verification_client_ticket?: string;
	email_verification_solved?: boolean;

	first_sign_up_auto_login?: boolean;
}
