import type { OutgoingEmail } from '.';
import { EmailConfig } from './config';

export async function handleJob(job: OutgoingEmail): Promise<void> {
	console.log('Sending email', job.id, job.address, job.subject);
	let res = await fetch('https://api.postmarkapp.com/email', {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'X-Postmark-Server-Token': process.env.POSTMARK_SERVER_API_KEY
		},
		body: JSON.stringify({
			From: EmailConfig.FROM_EMAIL,
			To: job.address,
			Subject: job.subject,
			HtmlBody: job.content,
			TextBody: job.content_plain,
			Tag: job.purpose,
			Headers: [{ Name: 'Message-ID', Value: `<${job.id}@sleep.maowtm.org>` }],
			Metadata: {
				user_id: job.user_id
			}
		})
	});
	let json = await res.json();
	if (!res.ok) {
		throw new Error(`Postmark error: ${json.ErrorCode} ${json.Message}`);
	}
}
