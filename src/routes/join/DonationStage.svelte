<script lang="ts">
	import { TimezoneContext, useTimezoneContext } from '$lib/TimezoneContext';
	import CurrencySelect, { guessCurrency } from '$lib/components/CurrencySelect.svelte';
	import { tryValidate } from '$lib/utils';
	import { validateDonationAmount } from '$lib/validations';
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	const timezoneContext = useTimezoneContext();
	export let currency: string = guessCurrency($timezoneContext);
	export let donationAmount: string = ['CNY', 'JPY'].includes(currency) ? '10.00' : '1.00';
	$: donationAmountValidation = tryValidate(validateDonationAmount, donationAmount);
</script>

<h1>
	Donation commitment
	<img
		src="https://em-content.zobj.net/source/twitter/376/money-with-wings_1f4b8.png"
		alt="money with wings"
		class="emoji"
	/>
</h1>

<form
	action="#"
	on:submit={(evt) => {
		evt.preventDefault();
		dispatch('next');
	}}
>
	<p>
		To help you stick to your target, we ask that you commit to donating a certain amount of money
		for each minute you slip, according to the time you record your sleep.
	</p>

	<label>
		I commit to donate
		<CurrencySelect bind:value={currency} />
		<input
			type="number"
			class="amount"
			bind:value={donationAmount}
			min="0"
			step="0.01"
			on:blur={(evt) => {
				if (/^\d+$/.test(donationAmount)) donationAmount = `${donationAmount}.00`;
			}}
		/>
		per minute I slip.
	</label>

	<div class="nextprev">
		<button class="link back" on:click={(evt) => dispatch('back')}>Back</button>
		<input type="submit" class="next primary" value="Next" disabled={!!donationAmountValidation} />
	</div>

	{#if donationAmountValidation}
		<p class="error">
			{donationAmountValidation}
		</p>
	{/if}
</form>

<style lang="scss">
	@import './shared.scss';

	.amount {
		width: 100px;
		font-size: 20px;
	}
</style>
