<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	$: code = data.code;
</script>
