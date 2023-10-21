<script lang="ts">
	import Dismiss from '@fluentui/svg-icons/icons/dismiss_16_regular.svg?component';
	export let style: string | undefined = undefined;
</script>

<button class="link" {style} on:click>
	<Dismiss />
</button>

<style>
	button {
		color: var(--color-text);
		opacity: 0.8;
		cursor: pointer;
		vertical-align: middle;
	}
</style>
