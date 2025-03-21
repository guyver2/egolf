<script lang="ts">
	import type { LayoutProps } from './$types';
	import '../app.css';
	import { page } from '$app/state';
	import Navbar from '$lib/components/Navbar.svelte';
	
	
	let { data, children }: LayoutProps = $props();
	const { isLoggedIn, user } = data;

</script>

<svelte:head>
	<title>{page.data.meta.title}</title>
	<meta name="description" content={page.data.meta.description} />
</svelte:head>


<Navbar {isLoggedIn} {user} />

{@render children()}
