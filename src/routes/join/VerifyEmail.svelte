<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import NextPrev from './NextPrev.svelte';

	const dispatch = createEventDispatcher();
</script>

<h1>
	Verify email
	<img
		src="https://em-content.zobj.net/source/twitter/376/check-mark-button_2705.png"
		alt="check mark"
		class="emoji"
	/>
</h1>

<p>
	Almost there! We've sent you an email with a link to verify your email address. Please open the
	link and enter the code shown.
</p>

<NextPrev nextDisabled={true} />

<style lang="scss">
	@import './shared.scss';
</style>
