<script lang="ts" context="module">
	export enum Purpose {
		SignUp = 'signup',
		Login = 'login'
	}
</script>

<script lang="ts">
	import EmailLayout, { A_STYLE_NORMAL } from './EmailLayout.svelte';
	import { EmailConfig } from './config';
	const APP_NAME = EmailConfig.APP_NAME;

	export let username: string;
	export let purpose: Purpose;
	export let verificationLink: string;
</script>

<EmailLayout>
	{#if username}
		<p>
			Hi {username},
		</p>
	{:else}
		<p>Hello!</p>
	{/if}

	<p>
		{#if purpose == 'signup'}
			Thank you for signing up to {APP_NAME}! To verify your email address, open the link below to
			get your verification code:
		{:else if purpose == 'login'}
			Someone has requested to log in to your account. If this was you, click the following link to
			get your verification code:
		{/if}
	</p>

	<p>
		<a href={verificationLink} style={A_STYLE_NORMAL}>
			{verificationLink}
		</a>
	</p>

	<p>
		Please note that this link expires in 1 hours.
		{#if purpose == 'signup'}
			If you did not sign up to {APP_NAME}, someone has likely put the wrong email address. Please
			ignore this email, and we will not send you any further emails.
		{:else if purpose == 'login'}
			If you did not try to log in, you can safely ignore this email.
		{/if}
	</p>

	<p>
		Yours,<br />
		{APP_NAME}
	</p>
</EmailLayout>
