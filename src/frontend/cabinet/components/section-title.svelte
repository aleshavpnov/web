<script lang="ts">
	import type { Snippet } from 'svelte'

	/**
	 * Подпись внутри карточки: приглушённая, потому что главное в карточке — её содержимое.
	 * `gap` — отступ до содержимого, у карточек он разный.
	 */
	let { gap = 'md', children }: { gap?: 'none' | 'xs' | 'md' | 'lg'; children: Snippet } = $props()
</script>

<h2 class={['section-title', `section-title--${gap}`]}>{@render children()}</h2>

<style>
	.section-title {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--muted);

		&--none {
			margin-bottom: 0;
		}

		&--xs {
			margin-bottom: 0.25rem;
		}

		&--md {
			margin-bottom: 0.5rem;
		}

		&--lg {
			margin-bottom: 0.75rem;
		}
	}
</style>
