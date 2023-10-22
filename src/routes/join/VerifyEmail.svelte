<script lang="ts">
	import Skeleton from '$lib/components/Skeleton.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import { EMAIL } from '$lib/validations';
	import { onDestroy } from 'svelte';
	import NextPrev from './NextPrev.svelte';

	export let email: string;
	let fixingEmail = false;
	let newEmail: string;
	$: newEmail = email;

	let componentCancel: AbortController | null = null;
	let sendingVerification = false;
	let validatingNewEmail = false;
	let validationError: string | null = null;

	function cancelEverything() {
		if (componentCancel) {
			componentCancel.abort();
			componentCancel = null;
			validatingNewEmail = false;
			sendingVerification = false;
		}
	}

	async function sendVerificationEmail() {
		cancelEverything();
		sendingVerification = true;
		let cancel = new AbortController();
		componentCancel = cancel;
		// TODO
	}

	$: email, !fixingEmail ? sendVerificationEmail() : null;

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
	<form>
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
				disabled={!EMAIL.test(newEmail)}
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
{:else}
	<p>
		Almost there! We've sent you an email with a link to verify your email address. Please open the
		link and enter the code shown.
	</p>
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
	<NextPrev nextDisabled={true} />
{/if}

<style lang="scss">
	@import './shared.scss';
</style>
