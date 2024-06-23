<script lang="ts">
	import './style.scss';

	import { page } from '$app/stores';
	import { initAuthContext, logout } from '$lib/AuthenticationContext';
	import { TimezoneContext, newTimezoneContext } from '$lib/TimezoneContext';
	import '$lib/SWContext';

	// Initialize client clock skew
	import '$lib/time';
	import UserNotices, { showTransientAlert } from './UserNotices.svelte';
	import JustText from '$lib/components/JustText.svelte';
	import { goto } from '$app/navigation';
	import TimezoneDifferentWarning from '$lib/components/TimezoneDifferentWarning.svelte';

	const authContext = initAuthContext();
	const timezoneContext = newTimezoneContext();

	$: title = $page.data.title ? `${$page.data.title} - SleepOrGive` : 'SleepOrGive';

	$: isHome = $page.route.id == '/';
	$: isAdminPage = $page.data.is_admin_page ?? false;

	$: isLoggedIn = $authContext.isAuthenticated;
	$: username = $authContext.username;

	async function handleLogout() {
		try {
			await $authContext.fetch('/api/v1/logout', { method: 'POST' });
			logout();
			goto('/');
		} catch (e) {
			showTransientAlert({
				intent: 'error',
				component: JustText,
				props: {
					text: 'Failed to log out: ' + e.message
				}
			});
		}
	}

	$: if ($authContext.timezone) {
		$timezoneContext = TimezoneContext.fromZoneName($authContext.timezone);
		if ($timezoneContext.name != TimezoneContext.systemZone().name) {
			showTransientAlert({
				intent: 'info',
				component: TimezoneDifferentWarning,
				key: 'timezone_different_from_system',
				props: {
					userTimezone: $timezoneContext.name
				}
			});
		}
	}
</script>

<svelte:head>
	<title>{title}</title>
	<meta property="og:title" content={title} />
	<meta property="og:site_name" content="SleepOrGive" />
</svelte:head>

<div class="container">
	<nav>
		<span class="sitename">
			{#if isHome}
				<a href="https://maowtm.org" target="_blank">mw</a> /
			{/if}
			<a href={isLoggedIn ? '/overview' : '/'} class="sitename-link">SleepOrGive</a>
			{#if isHome}
				&mdash; Start sleeping earlier today!
			{:else if isAdminPage}
				Admin center
			{/if}
		</span>
		<span class="user">
			{#if isLoggedIn}
				<a href="/overview">{username ?? 'Overview'}</a>
				<!-- svelte-ignore a11y-missing-attribute -->
				<!-- svelte-ignore a11y-no-redundant-roles -->
				<a
					on:click={handleLogout}
					on:keydown={(e) => e.key == 'Enter' && handleLogout()}
					role="link"
					tabindex="0">Logout</a
				>
			{:else}
				{#if $page.route.id != '/login'}
					<a href="/login">Login</a>
				{/if}
				{#if $page.route.id != '/join'}
					<a href="/join">Sign up</a>
				{/if}
				<a href="https://github.com/micromaomao/SleepOrGive" target="_blank" class="gh">
					<img src="/images/github-mark.svg" alt="GitHub" width="16" height="16" />
				</a>
			{/if}
		</span>
	</nav>
	<div class="notices">
		<UserNotices />
	</div>
</div>

<slot />

<style>
	.container {
		position: sticky;
		top: 0;
		height: auto;
	}

	nav {
		background-color: var(--color-primary);
		color: white;
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: center;
		height: 40px;
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
