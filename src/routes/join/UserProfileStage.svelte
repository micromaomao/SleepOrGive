<script lang="ts">
	import { tryValidate } from '$lib/utils';
	import { mustBeValidUsername } from '$lib/validations';
	import { createEventDispatcher } from 'svelte';
	import { fly } from 'svelte/transition';
	import NextPrev from './NextPrev.svelte';
	const dispatch = createEventDispatcher();

	export let username: string = '';
	export let profile_public: boolean = false;
	$: username = username.replace(' ', '');
	$: usernameValidationError = username
		? tryValidate(mustBeValidUsername, username)
		: profile_public
		? 'A username is required for public profiles'
		: null;
	let alwaysShowPublicOption = false;
</script>

<h1>
	User profile
	<img
		src="https://em-content.zobj.net/source/twitter/376/bust-in-silhouette_1f464.png"
		alt="person"
		class="emoji"
	/>
</h1>

<form
	action="#"
	on:submit={(evt) => {
		evt.preventDefault();
		dispatch('next');
	}}
>
	<div>
		<label>
			<p>Choose a username for your account. You can change it later.</p>
			<input type="text" name="username" placeholder="your-name" bind:value={username} />
		</label>
	</div>

	{#if username != '' || profile_public || alwaysShowPublicOption}
		<p in:fly={{ duration: 200, x: 0, y: 10 }}>
			If you want, you can choose to make your profile (including sleep time and donation
			statistics) public, which will make it available under a username you can choose.
		</p>

		<label in:fly={{ duration: 200, x: 0, y: 0 }}>
			<input
				type="checkbox"
				bind:checked={profile_public}
				on:click={(evt) => (alwaysShowPublicOption = true)}
			/>
			Make my profile public
		</label>
	{/if}

	<NextPrev
		disabled={!!usernameValidationError}
		on:back
		on:next
		overrideNext={!username ? 'Skip' : null}
	/>

	<div class="error">
		{#if usernameValidationError}
			{usernameValidationError}
		{/if}
	</div>
</form>

<style lang="scss">
	@import './shared.scss';
</style>