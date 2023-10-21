<script lang="ts">
	import { flip } from 'svelte/animate';
	import Item from './NotificationAdvanceTimesInput/Item.svelte';
	import { fade } from 'svelte/transition';

	export let sleepNotificationAdvanceTimes: number[];

	interface ItemData {
		minutes?: number;
		empty: boolean;
	}

	let items: ItemData[];

	function populateItems(sleepNotificationAdvanceTimes: number[]) {
		let newItems: ItemData[] = sleepNotificationAdvanceTimes.map((x) => ({
			minutes: x,
			empty: false
		}));
		newItems.push({ empty: true });
		if (!items) {
			items = newItems;
			return;
		}
		for (let i = 0; i < newItems.length; i += 1) {
			let eq = items.find(
				(x) =>
					(x.empty && newItems[i].empty) ||
					(!x.empty && !newItems[i].empty && x.minutes == newItems[i].minutes)
			);
			if (eq !== undefined) {
				newItems[i] = eq;
			}
		}
		items = newItems;
	}

	$: populateItems(sleepNotificationAdvanceTimes);

	function repopulateList() {
		let newList = items
			.filter((x) => !x.empty && x.minutes !== null)
			.map((x) => Math.round(x.minutes));
		newList = Array.from(new Set(newList));
		newList.sort((a, b) => b - a);
		sleepNotificationAdvanceTimes = newList;
	}
</script>

{#each items as item (item)}
	<div animate:flip={{ duration: 200 }} transition:fade={{ duration: 200 }}>
		<Item bind:minutes={item.minutes} bind:empty={item.empty} on:confirm={repopulateList} />
	</div>
{/each}
