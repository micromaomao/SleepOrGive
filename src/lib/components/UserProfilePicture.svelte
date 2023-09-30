<script lang="ts">
	export let user_id: string;
	export let username: string;
	export let size: number = 24;
</script>

<img
	src={`/api/v1/user/${encodeURIComponent(user_id)}/avatar?size=${size * 2}`}
	alt={`Profile picture for ${username}`}
	width={size}
	height={size}
/>

<style>
	img {
		border-radius: 50%;
	}
</style>
