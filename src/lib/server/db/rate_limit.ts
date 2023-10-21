import { withDBClient, type Client as DBClient } from '.';

export class RateLimitBumpResponse {
	constructor(
		public readonly success: boolean,
		public readonly limit: number,
		public readonly remaining: number,
		public readonly reset: Date,
		public readonly evaluated_at: Date
	) {}

	get reset_remaining_secs(): number {
		let reset_remaining_secs = Math.floor(
			(this.reset.getTime() - this.evaluated_at.getTime()) / 1000
		);
		if (reset_remaining_secs < 0) {
			reset_remaining_secs = 0;
		}
		return reset_remaining_secs;
	}

	makeHeaders(): { [key: string]: string } {
		return {
			'RateLimit-Limit': this.limit.toString(),
			'RateLimit-Remaining': this.remaining.toString(),
			'RateLimit-Reset': this.reset_remaining_secs.toString()
		};
	}
}

export class RateLimit {
	constructor(public readonly key: string, public limit: number, public reset_period: number) {
		if (limit <= 0 || reset_period <= 0) {
			throw new Error('Invalid rate limit configuration');
		}
	}

	/**
	 * If `http_res` is provided, will attach RateLimit-* headers to it.
	 */
	public async bump(db?: DBClient, http_res?: Response): Promise<RateLimitBumpResponse> {
		if (!db) {
			return await withDBClient((db) => this.bump(db));
		}
		let reset_period = this.reset_period;
		if (typeof reset_period != 'number') {
			throw new Error('Assertion failed');
		}
		await db.query({
			text: `update rate_limit_state
        set last_reset = now(), count = 0
        where
          key = $1 and
          last_reset <= now() - '${reset_period} seconds'::interval`,
			values: [this.key]
		});
		let { rows }: { rows: any[] } = await db.query({
			text: `insert into rate_limit_state as old (key, last_reset, count)
          values ($1, now(), 1)
          on conflict (key) do update set
            count = old.count + 1
          returning last_reset, count, now() as db_now`,
			values: [this.key]
		});
		if (rows.length == 0) {
			throw new Error('Assertion failed: no rows returned from insert');
		}
		let last_reset: Date = rows[0].last_reset;
		let count: number = rows[0].count;
		let remaining = this.limit - count;
		if (remaining < 0) {
			remaining = 0;
		}
		let reset = new Date(last_reset.getTime() + this.reset_period * 1000);
		let db_now: Date = rows[0].db_now; // Prevent weird clock skew issues
		let ret: RateLimitBumpResponse = new RateLimitBumpResponse(
			count <= this.limit,
			this.limit,
			remaining,
			reset,
			db_now
		);
		return ret;
	}
}
