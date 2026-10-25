<script lang="ts">
	import type { Snippet } from 'svelte'

	import Footer from '#frontend/components/footer.svelte'
	import Topbar from '#frontend/components/topbar.svelte'
	import type { Page } from '#frontend/site/pages.ts'

	let { page, children }: { page: Page; children: Snippet } = $props()

	// Голая разметка обезличена, брендовую вкладку возвращаем живому посетителю здесь.
	// Неиндексацию держит meta robots, а не title.
	$effect(() => {
		document.title = 'Alesha Vepenov'
	})
</script>

<Topbar {page} />
<main class="shell">
	{@render children()}
</main>
<Footer />

<style>
	.shell {
		display: flex;
		flex: 1;
		flex-direction: column;
		width: 100%;
		padding: 2rem var(--gutter);
	}
</style>
