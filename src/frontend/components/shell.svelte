<script lang="ts">
	import type { Snippet } from 'svelte'

	import Footer from '#frontend/components/footer.svelte'
	import Topbar from '#frontend/components/topbar.svelte'
	import { reportRefHit } from '#frontend/site/api/client.ts'
	import type { Page } from '#frontend/site/pages.ts'
	import { captureRef, getVisitorKey } from '#frontend/site/state/ref.ts'
	import { ensureStatus } from '#frontend/site/state/status.ts'

	/** `wide` отдаёт странице всю ширину колонки, иначе текст держится в --prose. */
	let { page, wide = false, children }: { page: Page; wide?: boolean; children: Snippet } = $props()

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
	<div class={['shell__content', wide && 'shell__content--wide']}>
		{@render children()}
	</div>
</main>
<Footer />

<style>
	.shell {
		display: flex;
		flex: 1;
		flex-direction: column;
		width: 100%;
		max-width: var(--column);
		margin-inline: auto;
		padding: 2rem var(--gutter);

		@media (--md) {
			padding-block: 3rem;
		}

		&__content {
			display: flex;
			flex: 1;
			flex-direction: column;
			width: 100%;
			max-width: var(--prose);
			margin-inline: auto;

			&--wide {
				max-width: none;
			}
		}
	}
</style>
