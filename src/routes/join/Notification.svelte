<script lang="ts">
	import { getServiceWorkerContext } from '$lib/SWContext';
	import Alert from '$lib/components/Alert.svelte';
	import NextPrev from './NextPrev.svelte';

	const swContext = getServiceWorkerContext();

	let permissionGrantedOrDenied = false;

	$: browserSupport = $swContext.browserSupport;
	$: permissionState = $swContext.pushPermissionState;

	$: if (permissionState == 'granted' || permissionState == 'denied') {
		permissionGrantedOrDenied = true;
	}
</script>

<h1>
	Notification
	<img
		src="https://em-content.zobj.net/source/twitter/376/alarm-clock_23f0.png"
		alt="alarm clock"
		class="emoji"
	/>
</h1>

{#if browserSupport}
	<p>
		To make this app more effective, we strongly recommend all user turn on push notification, which
		will remind you ahead of time to go to bed. You can customize the time of the notifications
		below.
	</p>
	<div class="grantcontainer">
		{#if permissionState == 'denied'}
			<Alert intent="error">
				You have denied the permission to send notification. You can re-enable it in your browser's
				site settings menu.
			</Alert>
		{:else if permissionState == 'granted'}
			<Alert intent="success">You have already granted the permission to send notification.</Alert>
		{:else}
			<button>Grant notification permission</button>
			<button class="link">Skip for now</button>
		{/if}
	</div>

	<details class="customize">
		<summary>Customize notification</summary>

		Send notification at the following time:
	</details>
{:else}
	<div style="margin-top: 10px;">
		<Alert intent="error">
			Your browser does not support push notification. You can still use this app, but you will not
			receive any sleep reminders on this device.
		</Alert>
	</div>
{/if}

<NextPrev nextDisabled={!permissionGrantedOrDenied && browserSupport} />

<style lang="scss">
	@import './shared.scss';

	.grantcontainer {
		margin: 20px 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20px;
	}

	.customize {
		align-self: stretch;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		text-align: left;
	}
</style>
