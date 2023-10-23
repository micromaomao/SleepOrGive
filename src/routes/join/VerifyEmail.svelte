<script lang="ts">
	import Skeleton from '$lib/components/Skeleton.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import { EMAIL } from '$lib/validations';
	import { onDestroy, onMount } from 'svelte';
	import NextPrev from './NextPrev.svelte';
	import { generateToken } from '$lib/secure_token.browser';
	import Alert from '$lib/components/Alert.svelte';
	import type { SignupSessionData } from './+page.svelte';
	import { emailVerificationCodeStore } from '$lib/useLocalStorage';

	export let email: string;
	let fixingEmail = false;
	let newEmail: string;
	$: newEmail = email;

	let componentCancel: AbortController | null = null;
	let sendingVerification = false;
	let validatingNewEmail = false;
	let validationError: string | null = null;

	let sendError: string | null = null;
	let mustResend: boolean = false;

	let codeInput: string = '';
	let codeInputElement: HTMLInputElement;

	$: codeInputElement?.focus?.();

	function isValidCode(code: string) {
		return /^\d{6}$/.test(code);
	}

	const sharedCodeStore = emailVerificationCodeStore;
	onMount(() => {
		$sharedCodeStore = 'expecting';
	});
	$: {
		if (isValidCode($sharedCodeStore)) {
			codeInput = $sharedCodeStore;
		} else {
			$sharedCodeStore = 'expecting';
		}
	}

	export let clientTicket: SignupSessionData['clientTicket'] = null;

	function cancelEverything() {
		if (componentCancel) {
			componentCancel.abort();
			componentCancel = null;
		}
		validatingNewEmail = false;
		sendingVerification = false;
		sendError = null;
	}

	async function sendVerificationEmail() {
		cancelEverything();
		sendingVerification = true;
		let cancel = new AbortController();
		componentCancel = cancel;
		try {
			if (!clientTicket || clientTicket.email != email) {
				let { token_str } = await generateToken();
				if (cancel.signal.aborted) return;
				clientTicket = {
					ticket: token_str,
					email
				};
				return; // Svelte will re-run this function
			}
			let res = await fetch(`/api/v1/join/send-verification-email`, {
				method: 'POST',
				signal: cancel.signal,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					ticket: clientTicket.ticket,
					email
				})
			});
			if (cancel.signal.aborted) return;
			if (!res.ok) {
				let { message } = await res.json();
				sendError = message;
			}
		} catch (e) {
			if (cancel.signal.aborted) return;
			sendError = `Network error occurred while sending verification email - try again later.`;
			console.error(e);
		} finally {
			if (componentCancel === cancel) {
				componentCancel = null;
				sendingVerification = false;
			}
		}
	}

	$: {
		email, clientTicket;
		if (!fixingEmail) {
			sendVerificationEmail();
		}
	}

	async function handleChangeEmail() {
		cancelEverything();
		validatingNewEmail = true;
		let currentCancel = new AbortController();
		componentCancel = currentCancel;
		try {
			let res = await fetch(`/api/v1/join/checkemail?email=${encodeURIComponent(newEmail)}`, {
				signal: currentCancel.signal
			});
			if (componentCancel !== currentCancel) {
				return;
			}
			if (!res.ok) {
				validationError = (await res.json()).message;
			} else {
				validationError = null;
			}
		} catch (e) {
			if (componentCancel !== currentCancel) {
				return;
			}
			validationError = `Network error occurred while checking your email - try again later.`;
			console.error(e);
		}
		validatingNewEmail = false;
		componentCancel = null;
		if (!validationError) {
			email = newEmail;
			fixingEmail = false;
		}
	}

	onDestroy(() => {
		cancelEverything();
	});

	async function handleSubmitCode() {
		$sharedCodeStore = null;
		cancelEverything();
		let cancel = new AbortController();
		componentCancel = cancel;
		// TODO
	}
</script>

<h1>
	Verify email
	<img
		src="https://em-content.zobj.net/source/twitter/376/check-mark-button_2705.png"
		alt="check mark"
		class="emoji"
	/>
</h1>

{#if fixingEmail}
	<form on:submit={(evt) => evt.preventDefault()}>
		<label>
			<p>Enter another email address:</p>
			<input type="email" name="email" bind:value={newEmail} />
		</label>
		<br />
		{#if !validatingNewEmail}
			<input
				class="primary"
				type="submit"
				value="Resend"
				disabled={!EMAIL.test(newEmail) || newEmail === email}
				on:click={handleChangeEmail}
			/>
		{:else}
			<button class="primary" disabled={true} style="cursor: progress;">
				<Spinner />
				Resend
			</button>
		{/if}
		<button
			class="secondary"
			on:click={() => {
				fixingEmail = false;
				newEmail = email;
				validationError = null;
			}}
		>
			Cancel
		</button>
	</form>

	{#if validationError}
		<p>
			{validationError}
		</p>
	{/if}
{:else if sendingVerification}
	<br />
	<Skeleton />
	<Skeleton />
	<br />
{:else if sendError}
	<Alert
		intent="error"
		hasRetry={true}
		on:retry={sendVerificationEmail}
		style="align-self: stretch; text-align: left; margin: 30px 0;"
	>
		{sendError}
	</Alert>

	<NextPrev nextDisabled={true} overrideNext="Create user" />
{:else}
	<p>
		Almost there! We've sent you an email with a link to verify your email address. Please open the
		link and enter the code shown.
	</p>

	<form on:submit={(evt) => evt.preventDefault()}>
		<input type="text" bind:value={codeInput} bind:this={codeInputElement} placeholder="123456" />

		<NextPrev
			nextDisabled={sendingVerification || !isValidCode(codeInput)}
			validationGate={handleSubmitCode}
			overrideNext="Create user"
		/>
	</form>
{/if}

{#if !fixingEmail}
	<div>
		The email address you provided was:<br />
		<b>{email}</b><br />
		<button
			class="link"
			on:click={() => {
				fixingEmail = true;
			}}>Incorrect? Click here to fix</button
		>
	</div>
{/if}

<style lang="scss">
	@import './shared.scss';
</style>
