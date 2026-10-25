<script lang="ts">
	/**
	 * Кнопка способа оплаты — одна на визард и витрину тарифов.
	 *
	 * Внутри кнопки две строки: название способа и комиссия. Комиссия живёт именно здесь, а не
	 * подписью снизу: способы сравнивают в момент нажатия, а не в тексте вокруг. Иконка
	 * ростом с обе строки и по центру относительно них: мелкая, прижатая к заголовку,
	 * читалась как случайный значок, а не как метка способа оплаты.
	 */
	import type { LucideIcon } from '@lucide/svelte'
	import type { Snippet } from 'svelte'

	let {
		label,
		fee,
		icon: Icon,
		primary = false,
		disabled = false,
		onclick,
		children,
	}: {
		label: string
		/** Комиссия второй строкой внутри кнопки. Не задана — кнопка в одну строку. */
		fee?: string
		icon: LucideIcon
		primary?: boolean
		disabled?: boolean
		onclick: () => void
		/** Сноска под кнопкой (например про автопродление). */
		children?: Snippet
	} = $props()
</script>

<div>
	<button type="button" class={['pay-option', primary && 'pay-option--primary']} {disabled} {onclick}>
		<!-- Штрих тоньше обычного: у крупной иконки дефолтные 2px выглядят грубо. -->
		<Icon class="pay-option__icon" size={32} strokeWidth={1.75} />
		<span class="pay-option__text">
			<span class="pay-option__label">{label}</span>
			{#if fee}<span class="pay-option__fee">{fee}</span>{/if}
		</span>
	</button>
	{@render children?.()}
</div>

<style>
	.pay-option {
		cursor: pointer;
		display: flex;
		gap: 0.75rem;
		align-items: center;
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid var(--input-border);
		border-radius: var(--radius);
		font: inherit;
		color: inherit;
		text-align: left;
		background: var(--input-bg);
		transition: background-color 0.15s;

		&:hover {
			background: var(--surface);
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
			border-color: transparent;
			color: var(--brand-fill-fg);
			background: var(--brand-fill);

			&:hover {
				background: color-mix(in srgb, var(--brand-fill) 85%, transparent);
			}
		}

		:global(.pay-option__icon) {
			flex-shrink: 0;
		}

		&__text {
			display: flex;
			flex-direction: column;
			min-width: 0;
		}

		&__label {
			font-size: 1.125rem;
			font-weight: 600;
		}

		&__fee {
			font-size: 0.75rem;
			opacity: 0.75;
		}
	}
</style>
