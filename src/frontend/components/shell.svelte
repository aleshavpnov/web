<script lang="ts">
	import type { Snippet } from 'svelte'

	import Footer from '#frontend/components/footer.svelte'
	import Topbar from '#frontend/components/topbar.svelte'
	import { reportRefHit } from '#frontend/site/api/client.ts'
	import type { Page } from '#frontend/site/pages.ts'
	import { captureRef, getVisitorKey } from '#frontend/site/state/ref.ts'
	import { ensureStatus } from '#frontend/site/state/status.ts'

	let { page, children }: { page: Page; children: Snippet } = $props()

	// Голая разметка обезличена, брендовую вкладку возвращаем живому посетителю здесь.
	// Неиндексацию держит meta robots, а не title.
	$effect(() => {
		document.title = 'Alesha Vepenov'
	})

	// Переход по реф-ссылке отмечаем, только когда код пришёл именно в адресе этой загрузки,
	// и не задерживая страницу.
	const ref = captureRef(location.search)

	if (ref) void reportRefHit(ref, getVisitorKey())

	ensureStatus()
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
