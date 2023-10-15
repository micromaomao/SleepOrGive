<script lang="ts">
	import { EMAIL } from '$lib/validations';
	import { createEventDispatcher, onMount } from 'svelte';
	import NextPrev from './NextPrev.svelte';
	const dispatch = createEventDispatcher();

	let email_input: HTMLInputElement;
	export let email: string = '';

	onMount(() => {
		email_input.focus();
	});
</script>

<h1>
	Welcome <img
		src="https://em-content.zobj.net/source/twitter/376/waving-hand_1f44b.png"
		alt="welcome"
		class="emoji"
	/>
</h1>
<p>
	We're glad you're here and to help you sleep better! <br />Already have an account?
	<a href="/login">Log in here</a>.
</p>

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

	<NextPrev disabled={!EMAIL.test(email)} hasPrev={false} on:next />
</form>

<style lang="scss">
	@import './shared.scss';
</style>
