<script context="module" lang="ts">
	export interface SignupSessionData {
		currentStep: string;
		email?: string;
		username?: string;
		profile_public?: boolean;
		sleepTargetTime?: string;
		donationAmount?: string;
		currency?: string;
	}
</script>

<script lang="ts">
	import EmailStage from './EmailStage.svelte';
	import UserProfileStage from './UserProfileStage.svelte';
	import TargetStage from './TargetStage.svelte';

	import { goto } from '$app/navigation';
	import Alert from '$lib/components/Alert.svelte';
	import { fly } from 'svelte/transition';
	import { useHideScrollbars } from '$lib/utils';
	import DonationStage from './DonationStage.svelte';
	import VerifyEmail from './VerifyEmail.svelte';
	import { browser } from '$app/environment';
	import Notification from './Notification.svelte';
	import { initNextPrevContext } from './NextPrev.svelte';

	const STAGES = ['email', 'target', 'donation', 'username', 'notification', 'verifyemail'];

	let signupSessionData: SignupSessionData = {
		currentStep: STAGES[0]
	};

	let currMaxStage = 0;
	let hash = '';
	$: findStage = STAGES.indexOf(hash.slice(1));
	$: currentStage = findStage >= 0 ? Math.min(findStage, currMaxStage) : 0;
	$: stage = STAGES[currentStage];

	function setStage(stage: number) {
		currMaxStage = Math.max(stage, currMaxStage);
		let newHash = '#' + STAGES[stage];
		goto(newHash);
		hash = newHash;
		signupSessionData.currentStep = STAGES[stage];
	}

	function initSessionData() {
		try {
			let data = JSON.parse(sessionStorage.getItem('signupSessionData') ?? 'null');
			if (data) {
				signupSessionData = data;
				let stageIdx = STAGES.indexOf(signupSessionData.currentStep);
				if (stageIdx >= 0) {
					setStage(stageIdx);
				}
			}
		} catch (e) {
			console.error(e);
		}
	}

	if (browser) {
		initSessionData();
	}

	$: if (browser) {
		sessionStorage.setItem('signupSessionData', JSON.stringify(signupSessionData));
	}

	function nextStage() {
		setStage(currentStage + 1);
	}

	function previousStage() {
		setStage(currentStage - 1);
	}

	const hideSCrollbars = useHideScrollbars();

	const nextPrevContext = initNextPrevContext({
		onBack: previousStage,
		onNext: nextStage
	});

	$: $nextPrevContext.hasPrev = currentStage > 0;
</script>

<svelte:window on:hashchange={(evt) => (hash = window.location.hash)} />

<noscript>
	<Alert intent="error">
		This app requires JavaScript to be enabled! Please enable it in your browser and refresh the
		page.
	</Alert>
</noscript>

{#key currentStage}
	<div
		in:fly={{ duration: 200, x: 30, y: 0 }}
		class="content"
		on:introstart={() => hideSCrollbars(true)}
		on:introend={() => hideSCrollbars(false)}
	>
		{#if stage == 'email'}
			<EmailStage bind:email={signupSessionData.email} />
		{/if}
		{#if stage == 'target'}
			<TargetStage bind:sleepTargetTime={signupSessionData.sleepTargetTime} />
		{/if}
		{#if stage == 'donation'}
			<DonationStage
				bind:donationAmount={signupSessionData.donationAmount}
				bind:currency={signupSessionData.currency}
			/>
		{/if}
		{#if stage == 'username'}
			<UserProfileStage
				bind:username={signupSessionData.username}
				bind:profile_public={signupSessionData.profile_public}
			/>
		{/if}
		{#if stage == 'notification'}
			<Notification />
		{/if}
		{#if stage == 'verifyemail'}
			<VerifyEmail />
		{/if}
	</div>
{/key}

<style lang="scss">
	.content {
		text-align: center;
		max-width: 750px;
		display: flex;
		flex-direction: column;
		min-height: 60vh;
		align-items: center;
		font-size: 20px;
	}

	// Need to import in lang="scss" to make it scoped to component.
	@import './shared.scss';

	.content {
		:global(h1) {
			margin-top: 200px;
			font-size: 35px;
		}

		@media (max-width: 600px), (max-height: 900px) {
			:global(h1) {
				margin-top: 50px;
			}
		}
	}
</style>
