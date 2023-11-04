<script lang="ts">
	import { goto } from '$app/navigation';
	import { AuthContext, storeNewToken, useAuthContext } from '$lib/AuthenticationContext';
	import Alert from '$lib/components/Alert.svelte';
	import { generateToken } from '$lib/secure_token.browser';
	import { tryValidate } from '$lib/utils';
	import { mustBeValidEmail, mustBeValidVerificationCode } from '$lib/validations';
	import { onMount } from 'svelte';

	const authContext = useAuthContext();

	let email: string;
	$: emailValid = !tryValidate(mustBeValidEmail, email);

	let submitting = false;
	let error: string | null = null;

	let ticket: string | null = null;

	let emailSent = false;

	let code: string = '';
	$: codeValid = !tryValidate(mustBeValidVerificationCode, code);

	$: {
		email;
		emailSent = false;
		code = '';
		generateToken().then((t) => (ticket = t.token_str));
	}

	async function handleSubmitEmail() {
		submitting = true;
		error = null;
		try {
			let res = await fetch('/api/v1/login/authorize', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					email,
					ticket
				})
			});
			if (!res.ok) {
				let e = await res.json();
				error = e.message;
				if (e.requireNewCode) {
					emailSent = false;
				}
			} else {
				let body = await res.json();
				if (body.emailSent) {
					emailSent = true;
				}
			}
		} catch (e) {
			console.error(e);
			error = `Network error while logging in - try again later.`;
		} finally {
			submitting = false;
		}
	}

	async function handleLogin() {
		submitting = true;
		error = null;
		try {
			let res = await fetch('/api/v1/login/authorize', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					email,
					ticket,
					code
				})
			});
			if (!res.ok) {
				let e = await res.json();
				error = e.message;
				if (e.requireNewCode) {
					emailSent = false;
				}
			} else {
				let body = await res.json();
				storeNewToken(
					body.authToken,
					new AuthContext(body.authToken, body.user_id, body.username, body.timezone)
				);
				goto('/overview');
			}
		} catch (e) {
			console.error(e);
			error = `Network error while logging in - try again later.`;
		} finally {
			submitting = false;
		}
	}
</script>

<div class="content">
	{#if $authContext.isAuthenticated}
		<Alert intent="info" style="margin: 0;">You are already logged in.</Alert>
	{/if}

	<form>
		<h1>Sign in</h1>

		<p>Sign in with email:</p>

		<div class="email-input">
			<!-- svelte-ignore a11y-autofocus -->
			<input
				type="email"
				name="email"
				placeholder="email@example.com"
				autofocus
				bind:value={email}
			/>
		</div>

		{#if !emailSent}
			<input
				type="submit"
				value="Continue"
				class="primary"
				disabled={!emailValid || submitting}
				on:click={handleSubmitEmail}
			/>
		{/if}

		{#if emailSent}
			<label class="code-input">
        Code:
				<input type="text" name="code" placeholder="000000" bind:value={code} />
			</label>

			<input
				type="submit"
				value="Log in"
				class="primary"
				disabled={!codeValid || submitting}
				on:click={handleLogin}
			/>
		{/if}

		{#if error}
			<Alert intent="error" style="margin: 30px auto;">{error}</Alert>
		{/if}
	</form>
</div>

<style lang="scss">
	form {
		text-align: center;
		max-width: 550px;
		margin: 30px auto 0 auto;

		h1 {
			line-height: 2;
		}

		.email-input,
		.code-input {
			display: block;
			width: 100%;
			max-width: 400px;
			margin: 10px auto;
			font-size: 20px;

			input {
				text-align: center;
			}
		}
	}
</style>
