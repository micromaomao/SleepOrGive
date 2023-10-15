<script lang="ts">
	import { tryValidate } from '$lib/utils';
	import { mustBeValidUsername } from '$lib/validations';
	import { createEventDispatcher } from 'svelte';
	import { fly } from 'svelte/transition';
	import NextPrev from './NextPrev.svelte';
	const dispatch = createEventDispatcher();

	export let username: string = '';
	export let profile_public: boolean = false;
	$: if (!profile_public) username = '';
	$: username = username.replace(' ', '');
	$: usernameValidationError = username
		? tryValidate(mustBeValidUsername, username)
		: profile_public
		? 'USERNAME_REQUIRED'
		: null;
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
	<p>
		If you want, you can choose to make your profile (including sleep time and donation statistics)
		public, which will make it available under a username you can choose.
	</p>

	<label>
		<input type="checkbox" bind:checked={profile_public} />
		Make my profile public
	</label>

	{#if profile_public}
		<div in:fly={{ duration: 200, x: 0, y: 10 }}>
			<label>
				<p>Choose a username for your account. You can change it later.</p>
				<input type="text" name="username" placeholder="your-name" bind:value={username} />
			</label>
		</div>
	{/if}

	<NextPrev disabled={!!usernameValidationError} on:back on:next />

	<div class="error">
		{#if usernameValidationError && usernameValidationError != 'USERNAME_REQUIRED'}
			{usernameValidationError}
		{/if}
	</div>
</form>

<style lang="scss">
	@import './shared.scss';
</style>
