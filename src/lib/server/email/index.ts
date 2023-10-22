import { backgroundJobsManager } from '$lib/server/background_jobs';
import { withDBClient, type Client as DBClient } from '$lib/server/db';
import type { SvelteComponent } from 'svelte';
import { htmlToText } from 'html-to-text';

export enum Status {
	Pending = 0,
	Delivered = 1,
	Failed = 2
}

export function emailBackgroundJob(): Promise<Date | null> {
	return withDBClient(async (db) => {
		await db.query('begin transaction isolation level read committed');
		let { rows: jobs }: { rows: any[] } = await db.query({
			text: `
        select * from outgoing_mails
          where status = ${Status.Pending}
          order by retry_count asc, id asc
          limit 1
          for update skip locked
      `
		});
		if (jobs.length === 0) {
			return null;
		}
		if (jobs.length > 1) {
			throw new Error('Unexpected number of jobs');
		}
		let job = jobs[0];

		let ret_time = null;

		try {
			await handleJob(job);
			await db.query({
				text: `update outgoing_mails set status = ${Status.Delivered} where id = $1`,
				values: [job.id]
			});
		} catch (e) {
			console.error(`Error delivering email ${job.id}`, e);
			if (job.retry_count > 3) {
				await db.query({
					text: `update outgoing_mails set status = ${Status.Failed} where id = $1`,
					values: [job.id]
				});
			} else {
				await db.query({
					text: `update outgoing_mails set retry_count = retry_count + 1 where id = $1`,
					values: [job.id]
				});
				ret_time = new Date(Date.now() + 1000 * 5 * (job.retry_count + 1));
			}
		}
		await db.query({ text: 'commit' });
		return ret_time;
	});
}

async function handleJob(job: any): Promise<void> {
	throw new Error('Not implemented');
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
