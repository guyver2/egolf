<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import Navbar from '$lib/components/Navbar.svelte';
	let { children } = $props();

	const isLoggedIn = $state(false);

</script>

<svelte:head>
	<title>{page.data.meta.title}</title>
	<meta name="description" content={page.data.meta.description} />
</svelte:head>


<Navbar {isLoggedIn} />

{@render children()}
