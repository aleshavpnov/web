<script lang="ts">
	import type { Snippet } from 'svelte'

	/**
	 * Сноска под кнопкой способа оплаты. Плашка в цвет кнопки, а не серая строка: это
	 * преимущество способа, а не мелкий шрифт под ним. Приглушённой подписи здесь не хватало —
	 * её просто пролистывали.
	 */
	let { children }: { children: Snippet } = $props()
</script>

<p class="option-note">{@render children()}</p>

<style>
	.option-note {
		margin-top: 0.375rem;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius);
		font-size: 0.75rem;
		line-height: 1.375;
		color: var(--brand);
		background: color-mix(in srgb, var(--brand) 10%, transparent);
	}
</style>
