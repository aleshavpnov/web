<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { HTMLButtonAttributes } from 'svelte/elements'

	/**
	 * Кнопка кабинета. Ростом 44px, а не 36 как у кита: кабинет открывают пальцем в вебвью
	 * Telegram, и это нижняя граница комфортной тач-цели. `icon` — квадрат 36px для действий
	 * в строках списка. `brand` — фирменный зелёный у главного действия экрана.
	 */
	type Props = HTMLButtonAttributes & {
		variant?: 'primary' | 'brand' | 'outline' | 'ghost'
		size?: 'md' | 'icon'
		/** Во всю ширину строки. */
		wide?: boolean
		children: Snippet
	}

	let { variant = 'outline', size = 'md', wide = false, class: className, children, ...rest }: Props = $props()
</script>

<button
	type="button"
	class={['button', `button--${variant}`, `button--${size}`, wide && 'button--wide', className]}
	{...rest}
>
	{@render children()}
</button>

<style>
	.button {
		cursor: pointer;
		display: inline-flex;
		flex-shrink: 0;
		gap: 0.375rem;
		align-items: center;
		justify-content: center;
		height: 2.75rem;
		padding: 0 1rem;
		border: 1px solid transparent;
		border-radius: var(--radius);
		font: inherit;
		font-size: 0.9375rem;
		font-weight: 500;
		color: inherit;
		white-space: nowrap;
		background: none;
		transition:
			background-color 0.15s,
			border-color 0.15s,
			box-shadow 0.15s,
			opacity 0.15s;

		@media (--reduced-motion) {
			transition: none;
		}

		&:active:not(:disabled) {
			translate: 0 1px;
		}

		&:focus-visible {
			outline: none;
			box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring) 50%, transparent);
		}

		&:disabled {
			pointer-events: none;
			opacity: 0.5;
		}

		&--primary {
			color: var(--primary-fg);
			background: var(--primary);

			&:hover {
				background: color-mix(in srgb, var(--primary) 80%, transparent);
			}
		}

		&--brand {
			color: var(--brand-fill-fg);
			background: var(--brand-fill);

			&:hover {
				background: color-mix(in srgb, var(--brand-fill) 85%, transparent);
			}
		}

		&--outline {
			border-color: var(--input-border);
			background: var(--input-bg);

			&:hover {
				background: var(--surface);
			}
		}

		&--ghost:hover {
			background: var(--surface);
		}

		&--icon {
			width: 2.25rem;
			height: 2.25rem;
			padding: 0;
		}

		&--wide {
			width: 100%;
		}
	}
</style>
