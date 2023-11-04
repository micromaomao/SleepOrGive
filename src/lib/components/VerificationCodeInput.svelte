<script lang="ts">
	import { useEmailVerificationCodeAutofill } from '$lib/useLocalStorage';

	export let value: string;
	useEmailVerificationCodeAutofill((newCode) => {
		value = newCode;
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
