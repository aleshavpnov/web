<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements'

	/**
	 * Главная кнопка: крупная, во всю ширину, фирменного цвета. С `href` это ссылка,
	 * без него -- кнопка. `glow` добавляет мягкое свечение, которое тянет взгляд.
	 */
	type Props = { glow?: boolean; children: Snippet } & (
		({ href: string } & HTMLAnchorAttributes) | ({ href?: undefined } & HTMLButtonAttributes)
	)

	let { glow = false, children, ...rest }: Props = $props()
</script>

{#if rest.href !== undefined}
	<a class={['cta', glow && 'cta--glow']} {...rest as HTMLAnchorAttributes}>{@render children()}</a>
{:else}
	<button class={['cta', glow && 'cta--glow']} type="button" {...rest as HTMLButtonAttributes}>
		{@render children()}
	</button>
{/if}

<style>
	.cta {
		cursor: pointer;
		display: inline-flex;
		gap: 0.5rem;
		align-items: center;
		justify-content: center;
		width: 100%;
		padding: 0.875rem 1.5rem;
		border: 0;
		border-radius: var(--radius);
		font: inherit;
		font-size: 1rem;
		font-weight: 600;
		color: var(--cta-fg);
		text-decoration: none;
		background: var(--cta-bg);
		transition:
			background-color 0.2s,
			box-shadow 0.2s,
			translate 0.2s;

		@media (--reduced-motion) {
			transition: none;
			animation: none;
		}

		&:hover:not(:disabled) {
			translate: 0 -2px;
			background: var(--cta-bg-hover);
			box-shadow: 0 10px 15px -3px color-mix(in srgb, var(--accent-fill) 40%, transparent);
		}

		&:active:not(:disabled) {
			translate: 0 0;
		}

		&:focus-visible {
			outline: 2px solid var(--ring);
			outline-offset: 2px;
		}

		&:disabled {
			cursor: default;
			opacity: 0.5;
		}

		&--glow {
			animation: glow 2.6s ease-in-out infinite;
		}
	}

	@keyframes glow {
		0%,
		100% {
			box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent-fill) 50%, transparent);
		}

		50% {
			box-shadow: 0 0 24px 5px color-mix(in srgb, var(--accent-fill) 40%, transparent);
		}
	}
</style>
