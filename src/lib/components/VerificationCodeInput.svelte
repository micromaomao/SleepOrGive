<script lang="ts">
	import { useEmailVerificationCodeAutofill } from '$lib/useLocalStorage';

	export let value: string;
	export let onAutofill: () => void | undefined = undefined;

	useEmailVerificationCodeAutofill((newCode) => {
		value = newCode;
		if (onAutofill) {
			setTimeout(onAutofill, 0);
		}
	});
</script>

<input
	type="text"
	name="code"
	placeholder="123456"
	maxlength="6"
	class="verification-code-input"
	bind:value
/>
