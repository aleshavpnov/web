<script lang="ts">
	import { ShieldCheck } from '@lucide/svelte'
	import type { Snippet } from 'svelte'

	import BackLink from '#frontend/components/back-link.svelte'
	import Eyebrow from '#frontend/components/eyebrow.svelte'
	import Shell from '#frontend/components/shell.svelte'
	import { LEGAL_UPDATED } from '#frontend/site/legal.ts'
	import type { Page } from '#frontend/site/pages.ts'

	/**
	 * Общий каркас юридической страницы: заголовок, дата редакции, текст и ссылка на главную.
	 * Разделы внутри -- компоненты legal-section.
	 */
	let { page, eyebrow, title, children }: { page: Page; eyebrow: string; title: string; children: Snippet } = $props()
</script>

<Shell {page}>
	<div class="legal">
		<header class="legal__head">
			<Eyebrow icon={ShieldCheck}>{eyebrow}</Eyebrow>
			<h1 class="legal__title">{title}</h1>
			<p class="legal__updated">Редакция от {LEGAL_UPDATED}</p>
		</header>
		{@render children()}
		<div class="legal__back"><BackLink /></div>
	</div>
</Shell>

<style>
	.legal {
		&__head {
			margin-bottom: 1.5rem;
		}

		&__title {
			font-size: 1.5rem;
			font-weight: 700;
			letter-spacing: -0.025em;
		}

		&__updated {
			margin-top: 0.5rem;
			font-size: 0.75rem;
			color: var(--muted);
		}

		&__back {
			margin-top: 2rem;
		}

		:global(.legal__section) {
			display: grid;
			gap: 0.5rem;
			margin-top: 1.5rem;
			font-size: 0.875rem;
			line-height: 1.625;
			color: var(--muted);
		}

		:global(.legal__heading) {
			margin-bottom: 0;
			font-size: 1rem;
			font-weight: 600;
			color: var(--fg);
		}

		:global(.legal__list) {
			display: grid;
			gap: 0.25rem;
			margin: 0;
			padding-left: 1.25rem;
		}
	}
</style>
