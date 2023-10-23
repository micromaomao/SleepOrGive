import { backgroundJobsManager } from '$lib/server/background_jobs';
import { withDBClient, type Client as DBClient } from '$lib/server/db';
import type { SvelteComponent } from 'svelte';
import { htmlToText } from 'html-to-text';
import { handleJob } from './send';

export enum Status {
	Pending = 0,
	Delivered = 1,
	Failed = 2
}

export interface OutgoingEmail {
	id: string;
	user_id: string;
	address: string;
	subject: string;
	content: string;
	content_plain: string;
	status: number;
	retry_count: number;
	pause_until: Date | null;
	purpose: OutgoingMailPurpose;
	bounced_at: Date;
	spam_reported_at: Date;
	opened_at: Date;
}

export function emailBackgroundJob(): Promise<Date | null> {
	return withDBClient(async (db) => {
		await db.query('begin transaction isolation level read committed');
		let time_thres = new Date();
		let { rows: jobs }: { rows: OutgoingEmail[] } = await db.query({
			text: `
        select * from outgoing_mails
          where status = ${Status.Pending}
						and (pause_until is null or pause_until <= $1)
          order by retry_count asc, id asc
          limit 1
          for update skip locked
      `,
			values: [time_thres]
		});
		if (jobs.length === 0) {
			({ rows: jobs } = await db.query({
				text: `
					select pause_until from outgoing_mails
						where status = ${Status.Pending}
							and pause_until is not null
							and pause_until > $1
				`,
				values: [time_thres]
			}));
			if (jobs.length > 0) {
				return jobs[0].pause_until;
			}
			return null;
		}
		if (jobs.length > 1) {
			throw new Error('Unexpected number of jobs');
		}
		let job = jobs[0];

		try {
			await handleJob(job);
			await db.query({
				text: `update outgoing_mails set status = ${Status.Delivered}, pause_until = null where id = $1`,
				values: [job.id]
			});
		} catch (e) {
			console.error(`Error delivering email ${job.id}`, e);
			if (job.retry_count >= 2) {
				await db.query({
					text: `update outgoing_mails set status = ${Status.Failed}, pause_until = null where id = $1`,
					values: [job.id]
				});
			} else {
				await db.query({
					text: `update outgoing_mails set retry_count = retry_count + 1, pause_until = $2 where id = $1`,
					values: [job.id, new Date(Date.now() + 1000 * 5)]
				});
			}
		}
		await db.query({ text: 'commit' });
		return new Date(); // Immediately trigger another run, in case there are more emails to send
	});
}

export enum OutgoingMailPurpose {
	Verification = 'verification'
}

export interface CreateOutgoingEmailOptions<P> {
	address: string;
	subject: string;
	component: typeof SvelteComponent<P> & {
		render: (props: P, options: { context: Map<string, any> }) => { html: string };
	};
	props: P;
	user_id: string | null;
	purpose: OutgoingMailPurpose;
}

export async function createOutgoingEmail<P>(
	options: CreateOutgoingEmailOptions<P>,
	db_client?: DBClient
): Promise<string> {
	if (!db_client) {
		return await withDBClient((db) => createOutgoingEmail(options, db));
	}
	const html = options.component.render(options.props, {
		context: new Map([['subject', options.subject]])
	}).html;
	const text = htmlToText(html);
	if (!options.user_id) {
		options.user_id = null;
	}
	let { rows }: { rows: any[] } = await db_client.query({
		text: `
				insert into outgoing_mails (
					user_id,
					address,
					subject,
					content,
					content_plain,
					status,
					purpose
				) values ($1, $2, $3, $4, $5, $6, $7)
				returning id
			`,
		values: [
			options.user_id,
			options.address,
			options.subject,
			html,
			text,
			Status.Pending,
			options.purpose
		]
	});
	let id = rows[0].id;
	backgroundJobsManager.triggerImmediate();
	return id;
}
