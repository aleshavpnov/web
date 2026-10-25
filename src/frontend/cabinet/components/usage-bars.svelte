<script lang="ts">
	/**
	 * Расход клиента по бакетам — одна серия величины. Легенды нет: серия одна, её называет
	 * заголовок карточки. Столбцы разделены зазором в 2px и скруглены на «конце данных».
	 * Шаг бакета задаёт карточка: на суточном окне снимки почасовые, и схлопывать их
	 * в один столбик значило бы выбросить всё разрешение.
	 */
	import { formatBucket, formatBytes } from '#frontend/cabinet/lib/format.ts'

	type Granularity = 'hour' | 'day'

	/** `bucket` — `YYYY-MM-DD` для суток, `YYYY-MM-DDTHH` для часа (UTC). */
	let { points, granularity }: { points: readonly { bucket: string; bytes: number }[]; granularity: Granularity } =
		$props()

	const H = 140
	const W = 640
	const BAR_GAP = 2
	const RADIUS = 4

	const titleId = $props.id()

	let hover = $state<number | null>(null)

	const max = $derived(Math.max(...points.map((d) => d.bytes), 1))
	const slot = $derived(W / Math.max(points.length, 1))
	const barW = $derived(Math.max(slot - BAR_GAP, 1))
	const active = $derived(hover === null ? null : points[hover])

	const barHeight = (bytes: number) => Math.max((bytes / max) * (H - 18), bytes > 0 ? RADIUS : 0)
</script>

{#if points.length === 0}
	<div class="usage-bars__empty">Снимков за окно нет</div>
{:else}
	<figure class="usage-bars">
		<svg
			class="usage-bars__chart"
			viewBox={`0 0 ${W} ${H}`}
			role="img"
			aria-labelledby={titleId}
			onmouseleave={() => (hover = null)}
		>
			<title id={titleId}>{granularity === 'hour' ? 'Расход по часам' : 'Расход по дням'}</title>
			{#each points as d, i (d.bucket)}
				{@const h = barHeight(d.bytes)}
				<g role="presentation" onmouseenter={() => (hover = i)}>
					<!-- Прозрачная зона попадания шире самого столбца — по тонкой полоске
					     курсором не попасть. -->
					<rect x={i * slot} y={0} width={slot} height={H} fill="transparent" />
					<rect
						class={['usage-bars__bar', hover === i && 'usage-bars__bar--active']}
						x={i * slot + BAR_GAP / 2}
						y={H - 18 - h}
						width={barW}
						height={h}
						rx={RADIUS}
					/>
				</g>
			{/each}
			<line class="usage-bars__grid" x1={0} x2={W} y1={H - 18} y2={H - 18} stroke-width={1} />
			<text class="usage-bars__axis" x={0} y={H - 4}>{formatBucket(points[0]?.bucket ?? '', granularity)}</text>
			<text class="usage-bars__axis" x={W} y={H - 4} text-anchor="end">
				{formatBucket(points.at(-1)?.bucket ?? '', granularity)}
			</text>
		</svg>

		{#if active}
			<div class="usage-bars__tip">
				<span class="usage-bars__tip-label">{formatBucket(active.bucket, granularity)}</span>
				<span class="usage-bars__tip-value">{formatBytes(active.bytes)}</span>
			</div>
		{/if}
	</figure>
{/if}

<style>
	.usage-bars {
		position: relative;
		margin: 0;

		&__empty {
			padding-block: 1.5rem;
			font-size: 0.875rem;
			color: var(--muted);
		}

		&__chart {
			display: block;
			width: 100%;
		}

		&__bar {
			fill: color-mix(in srgb, var(--viz-series-1) 70%, transparent);

			&--active {
				fill: var(--viz-series-1);
			}
		}

		&__grid {
			stroke: var(--viz-grid);
		}

		&__axis {
			font-size: 9px;
			font-variant-numeric: tabular-nums;
			fill: var(--muted);
		}

		&__tip {
			pointer-events: none;
			position: absolute;
			top: 0;
			right: 0;
			padding: 0.25rem 0.5rem;
			border-radius: calc(var(--radius) * 0.8);
			font-size: 0.75rem;
			background: var(--card);
			box-shadow:
				0 1px 2px rgb(0 0 0 / 5%),
				0 0 0 1px var(--card-ring);
		}

		&__tip-label {
			color: var(--muted);
		}

		&__tip-value {
			font-variant-numeric: tabular-nums;
		}
	}
</style>
