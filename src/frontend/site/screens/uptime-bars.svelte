<script lang="ts">
	import type { StatusNode } from '#frontend/site/api/schemas.ts'

	/** Полоса аптайма за последние 90 дней: столбик на день, высота и цвет от доли времени в строю. */
	let { bars }: { bars: StatusNode['bars'] } = $props()

	const cells = $derived(bars.slice(-90))

	function tone(ratio: number | null) {
		if (ratio === null) return 'none'

		if (ratio >= 0.99) return 'ok'

		return ratio >= 0.5 ? 'warn' : 'bad'
	}

	// Директива style: пишет атрибут, а его режет строгая CSP. Высоту ставим из скрипта.
	function height(node: HTMLElement, ratio: number | null) {
		node.style.height = ratio === null ? '40%' : `${Math.max(40, ratio * 100)}%`
	}
</script>

<div class="uptime-bars">
	{#each cells as bar (bar.day)}
		<span
			class="uptime-bars__bar uptime-bars__bar--{tone(bar.ratio)}"
			title={bar.day}
			{@attach (node) => height(node, bar.ratio)}
		></span>
	{/each}
</div>

<style>
	.uptime-bars {
		display: flex;
		gap: 1px;
		align-items: flex-end;
		height: 1.25rem;

		&__bar {
			flex: 1;
			min-width: 0;
			border-radius: 2px;
			background: var(--surface);

			&--ok {
				background: #10b981;
			}

			&--warn {
				background: #f59e0b;
			}

			&--bad {
				background: #ef4444;
			}
		}
	}
</style>
