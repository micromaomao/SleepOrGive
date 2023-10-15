<script lang="ts">
	import './style.scss';

	import { page } from '$app/stores';
	import { initAuthContext, reset as resetAuth, useAuthContext } from '$lib/AuthenticationContext';
	import { TimezoneContext, newTimezoneContext } from '$lib/TimezoneContext';

	// Initialize client clock skew
	import '$lib/time';

	const authContext = initAuthContext();
	const timezoneContext = newTimezoneContext();

	$: title = $page.data.title ? `${$page.data.title} - SleepOrGive` : 'SleepOrGive';

	$: isHome = $page.route.id == '/';
	$: isAdminPage = $page.data.is_admin_page ?? false;

	$: isLoggedIn = $authContext.isAuthenticated;
	$: username = $authContext.username ?? '...';

	async function handleLogout() {
		try {
			await $authContext.fetch('/api/v1/logout', { method: 'POST' });
			resetAuth(authContext);
		} catch (e) {
			// TODO
		}
	}

	$: if ($authContext.timezone) {
		$timezoneContext = TimezoneContext.fromZoneName($authContext.timezone);
	}
</script>

<svelte:head>
	<title>{title}</title>
	<meta property="og:title" content={title} />
	<meta property="og:site_name" content="SleepOrGive" />
</svelte:head>

<nav>
	<span class="sitename">
		{#if isHome}
			<a href="https://maowtm.org" target="_blank">mw</a> /
		{/if}
		<a href="/" class="sitename-link">SleepOrGive</a>
		{#if isHome}
			&mdash; Start sleeping earlier today!
		{:else if isAdminPage}
			Admin center
		{/if}
	</span>
	<span class="user">
		{#if isLoggedIn}
			<a href="/overview">{username}</a>
			<a
				on:click={handleLogout}
				on:keydown={(e) => e.key == 'Enter' && handleLogout()}
				role="link"
				tabindex="0">Logout</a
			>
		{:else}
			<a href="/login">Login</a>
			{#if $page.route.id != '/join'}
				<a href="/join">Sign up</a>
			{/if}
			<a href="https://github.com/micromaomao/SleepOrGive" target="_blank" class="gh">
				<img src="/images/github-mark.svg" alt="GitHub" width="16" height="16" />
			</a>
		{/if}
	</span>
</nav>

<slot />

<style>
	nav {
		background-color: var(--color-primary);
		color: white;
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: center;
		height: 40px;
		position: sticky;
		top: 0;
	}

	.sitename {
		margin-left: 18px;
	}

	.user {
		background-color: var(--color-background);
		color: var(--color-text);
		align-self: stretch;
		margin-left: auto;
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 0 20px;
		margin-right: 8px;
	}

	.sitename .sitename-link {
		font-size: 18px;
		font-weight: bold;
	}

	.sitename a {
		color: inherit;
	}

	.user > a {
		margin-right: 20px;
	}

	.user > a:last-child {
		margin-right: 0;
	}

	.gh {
		align-self: center;
		margin-top: 6px;
	}

	@media (max-width: 600px) {
		nav {
			flex-direction: column;
			height: auto;
		}

		nav > * {
			line-height: 1.7;
		}
	}
</style>
