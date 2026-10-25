<script lang="ts">
	/**
	 * Строка тарифа с выделенными числами: «<b>10</b> устройств · <b>449</b> ₽/мес».
	 *
	 * Выбирают тариф по двум цифрам — сколько устройств и сколько денег, — а в приглушённой
	 * строке подписи они тонули наравне со словами. Разметку не заводим: числа находим в уже
	 * готовой строке, чтобы источником текста остались `formatDevices` и `priceLabel`.
	 */
	let { text, size = 'sm' }: { text: string; size?: 'sm' | 'base' } = $props()

	const parts = $derived(text.split(/(\d+(?:[.,]\d+)?)/))
</script>

<span class={['plan-figures', `plan-figures--${size}`]}>
	{#each parts as part, i (i)}
		{#if /^\d/.test(part)}<b class="plan-figures__number">{part}</b>{:else}{part}{/if}
	{/each}
</span>

<style>
	.plan-figures {
		display: block;
		color: var(--muted);

		&--sm {
			margin-top: 0.125rem;
			font-size: 0.875rem;
		}

		&--base {
			margin-top: 0.25rem;
			font-size: 1rem;
		}

		&__number {
			font-weight: 600;
			color: var(--fg);
		}
	}
</style>
