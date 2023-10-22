<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { browser } from '$app/environment';
	import { emailVerificationCodeStore } from '$lib/useLocalStorage';
	import Alert from '$lib/components/Alert.svelte';

	export let data: PageData;

	$: code = data.code;

	const verificationCodeStore = emailVerificationCodeStore;
	let stored = false;

	$: {
		if (!stored && browser && $emailVerificationCodeStore == 'expecting') {
			$emailVerificationCodeStore = code;
			stored = true;
		}
	}
</script>

<div class="content">
	<h1>
		Your verification code is {code}.
	</h1>

	{#if stored}
		<Alert intent="success">Code autofilled.</Alert>
	{/if}

	<p>Please go back to the app and enter the code. Thank you for verifying your email address.</p>
</div>
