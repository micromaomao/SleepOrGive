<script lang="ts">
	import './style.scss';

	import type { PageData } from './$types';

	export let data: PageData;
	$: title = data.title ? `${data.title} - SleepOrGive` : 'SleepOrGive';
</script>

<svelte:head>
	<title>{title}</title>
	<meta property="og:title" content={title} />
	<meta property="og:site_name" content="SleepOrGive" />
</svelte:head>

<nav>
	<span class="sitename">
		<a href="/">SleepOrGive</a>
	</span>
	<span class="user">
		<a href="/login">Login</a>
		<a href="/join">Sign up</a>
		<a href="https://github.com/micromaomao/SleepOrGive" target="_blank">GitHub</a>
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
		font-size: 18px;
		font-weight: bold;
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
</style>
