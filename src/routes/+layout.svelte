<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	let { children } = $props();
</script>

<svelte:head>
	<title>{page.data.meta.title}</title>
	<meta name="description" content={page.data.meta.description} />
</svelte:head>

{@render children()}
