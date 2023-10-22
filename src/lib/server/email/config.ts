export class EmailConfig {
	static get ORIGIN(): string {
		return process.env.ORIGIN ?? 'https://sleep.maowtm.org';
	}
	static get APP_NAME(): string {
		return 'SleepOrGive';
	}
	static get FROM_EMAIL(): string {
		return process.env.SEND_FROM_EMAIL ?? 'notification@sleep.maowtm.org';
	}
}
