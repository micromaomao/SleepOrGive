<script lang="ts">
	import { createEventDispatcher } from 'svelte';

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

<div class="nextprev">
	<button class="link back" on:click={(evt) => dispatch('back')}>Back</button>
	<button class="next primary" on:click={(evt) => dispatch('next')} disabled={true}> Next </button>
</div>

<style lang="scss">
	@import './shared.scss';
</style>
