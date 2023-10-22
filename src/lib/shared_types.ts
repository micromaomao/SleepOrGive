export interface BasicUserData {
	username: string | null;
	user_id: string;
	timezone: string;
}
export interface UserData {
	sleep_data: {
		currentMonth: number;
		currentYear: number;
	};
}
