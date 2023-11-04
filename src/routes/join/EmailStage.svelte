<script lang="ts">
	import { EMAIL } from '$lib/validations';
	import { createEventDispatcher, onMount } from 'svelte';
	import NextPrev from './NextPrev.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import { useAuthContext } from '$lib/AuthenticationContext';
	const dispatch = createEventDispatcher();

	let email_input: HTMLInputElement;
	export let email: string = '';

	onMount(() => {
		email_input.focus();
	});

	let serverValidationError: string | null = null;
	$: email, (serverValidationError = null);

	async function handleServerValidation() {
		try {
			let res = await fetch(`/api/v1/join/checkemail?email=${encodeURIComponent(email)}`);
			if (!res.ok) {
				serverValidationError = (await res.json()).message;
			} else {
				serverValidationError = null;
			}
		} catch (e) {
			serverValidationError = `Network error occurred while checking your email - try again later.`;
		}
		if (serverValidationError) {
			throw new Error(serverValidationError);
		}
	}

	const authContext = useAuthContext();
</script>

<h1>
	Welcome <img
		src="https://em-content.zobj.net/source/twitter/376/waving-hand_1f44b.png"
		alt="welcome"
		class="emoji"
	/>
</h1>

{#if $authContext.isAuthenticated}
	<Alert intent="info">
		It looks like you're already logged in! Are you sure you want to create another account?
	</Alert>
{:else}
	<p>
		We're glad you're here and to help you sleep better! <br />Already have an account?
		<a href="/login">Log in here</a>.
	</p>
{/if}

<form
	action="#"
	on:submit={(evt) => {
		evt.preventDefault();
		dispatch('next');
	}}
>
	<p>
		We don't do passwords, so you will log in with your email <img
			src="https://em-content.zobj.net/source/twitter/376/e-mail_1f4e7.png"
			alt="email"
			class="emoji"
		/>.<br />
		Since we don't directly collect money from you, you will receive monthly reports with the amount
		you will need to donate, emailed to this address.
	</p>
	<p>
		You will not receive any marketing emails from us. By continuing, you agree to our <a
			href="/privacy"
			target="_blank">Privacy Policy</a
		>.
	</p>
	<input
		type="email"
		name="email"
		placeholder="your-name@example.com"
		bind:this={email_input}
		bind:value={email}
	/>

	<NextPrev
		nextDisabled={!EMAIL.test(email)}
		validationGate={async () => {
			email;
			await handleServerValidation();
		}}
	/>

	{#if serverValidationError}
		<div class="error">{serverValidationError}</div>
	{/if}
</form>

<style lang="scss">
	@import './shared.scss';
</style>
