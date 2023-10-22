export type BackgroundJobHandler = () => Promise<Date | null>;

export class BackgroundJobsManager {
	private nextTrigger: Date | null = null;
	private notifyCallback: () => void | null = null;
	private immediateCountdown = 0;
	private backgroundJobs: BackgroundJobHandler[] = [];

	constructor() {}

	notify() {
		if (this.notifyCallback) {
			this.notifyCallback();
			this.notifyCallback = null;
		}
	}

	triggerImmediate() {
		this.nextTrigger = new Date();
		this.immediateCountdown = 2; // Prevent race causing us to miss new work
		this.notify();
	}

	triggerLater(at: Date) {
		if (!this.nextTrigger || at.getTime() < this.nextTrigger.getTime()) {
			this.nextTrigger = at;
		}
		this.notify();
	}

	run() {
		this.triggerImmediate();
		this.thread().catch((e) => {
			console.error('Unexpected background thread error');
			setTimeout(() => {
				this.run();
			}, 1000);
			throw e;
		});
	}

	async thread() {
		const wait = (maxWait: number) => {
			if (this.notifyCallback !== null) {
				throw new Error('notifyCallback already exists');
			}
			if (maxWait <= 0) {
				return Promise.resolve();
			}
			return new Promise<void>((_resolve) => {
				let resolved = false;
				let resolve;
				let timeout = null;
				if (maxWait < Infinity) {
					setTimeout(() => {
						timeout = null;
						resolve();
					}, maxWait);
				}
				resolve = () => {
					if (!resolved) {
						resolved = true;
						this.notifyCallback = null;
						_resolve();
						if (timeout !== null) {
							clearTimeout(timeout);
							timeout = null;
						}
					}
				};
				this.notifyCallback = resolve;
			});
		};

		while (true) {
			this.nextTrigger = null;
			let jobs = this.backgroundJobs.slice();
			console.log(`Running the following background jobs: ${jobs.map((x) => x.name).join(', ')}`);
			let promises = jobs.map((x) => x());
			let rets = await Promise.allSettled(promises);
			let hasError = false;
			for (let i = 0; i < jobs.length; i++) {
				let job = jobs[i];
				let outcome = rets[i];
				if (outcome.status == 'fulfilled') {
					if (outcome.value) {
						this.triggerLater(outcome.value);
					}
				} else {
					console.error(
						'Error during background job processing for',
						job.name,
						':',
						outcome.reason
					);
					hasError = true;
				}
			}
			if (hasError) {
				this.immediateCountdown = 2;
				this.nextTrigger = null;
			}
			this.immediateCountdown = Math.max(0, this.immediateCountdown - 1);
			if (this.immediateCountdown > 0) {
				await wait(1000);
			} else if (this.nextTrigger) {
				await wait(this.nextTrigger.getTime() - Date.now());
			} else {
				console.log('BackgroundJobsManager: Nothing more to do');
				await wait(Infinity);
			}
		}
	}

	registerBackgroundJob(handler: BackgroundJobHandler) {
		this.backgroundJobs.push(handler);
	}
}

export const backgroundJobsManager = new BackgroundJobsManager();
