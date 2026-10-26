<script lang="ts">
	import { Activity, ArrowLeft, CircleHelp, Globe } from '@lucide/svelte'

	import ThemeToggle from '#frontend/components/theme-toggle.svelte'
	import type { Page } from '#frontend/site/pages.ts'

	let { page }: { page: Page } = $props()

	const NAV = [
		{ page: 'faq', href: '/faq', label: 'FAQ', icon: CircleHelp },
		{ page: 'status', href: '/status', label: 'Статус', icon: Activity },
	] as const
</script>

<header class="topbar">
	<a class="topbar__home" href="/">
		{#if page === 'home'}
			<Globe class="topbar__mark" size={16} />
			Alesha Vepenov
		{:else}
			<ArrowLeft class="topbar__mark" size={16} />
			Вернуться
		{/if}
	</a>
	<nav class="topbar__nav">
		{#each NAV as item (item.page)}
			{@const Icon = item.icon}
			<a
				class={['topbar__link', page === item.page && 'topbar__link--active']}
				href={item.href}
				aria-current={page === item.page ? 'page' : undefined}
			>
				<Icon class="topbar__icon" size={14} />
				{item.label}
			</a>
		{/each}
		<ThemeToggle />
	</nav>
</header>

<style>
	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem var(--gutter);
		border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent);

		&__home {
			display: inline-flex;
			gap: 0.5rem;
			align-items: center;
			font-size: 0.875rem;
			font-weight: 700;
			color: var(--fg);
			text-decoration: none;
			white-space: nowrap;

			&:hover {
				color: color-mix(in srgb, var(--fg) 80%, transparent);
			}
		}

		:global(.topbar__mark) {
			color: var(--accent);
		}

		&__nav {
			display: flex;
			gap: 1rem;
			align-items: center;
			font-size: 0.75rem;
			color: var(--muted);
		}

		&__link {
			display: inline-flex;
			gap: 0.375rem;
			align-items: center;
			color: inherit;
			text-decoration: none;
			transition: color 0.15s;

			&:hover {
				color: var(--fg);
			}

			&--active,
			&--active:hover {
				color: var(--accent);
			}
		}

		:global(.topbar__icon) {
			@media (width <= 420px) {
				display: none;
			}
		}
	}
</style>
