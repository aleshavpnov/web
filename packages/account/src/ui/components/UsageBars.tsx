/**
 * Расход клиента по бакетам — одна серия величины. Легенды нет: серия одна, её называет
 * заголовок карточки. Столбцы разделены зазором в 2px и скруглены на «конце данных».
 * Шаг бакета задаёт карточка: на суточном окне снимки почасовые, и схлопывать их
 * в один столбик значило бы выбросить всё разрешение.
 */
import { useId, useState } from 'react'

import { formatBytes, formatBucket } from '@/lib/format.ts'

export type Granularity = 'hour' | 'day'

export interface UsageBar {
	/** `YYYY-MM-DD` для суток, `YYYY-MM-DDTHH` для часа (UTC). */
	bucket: string
	bytes: number
}

const H = 140
const BAR_GAP = 2
const RADIUS = 4

export function UsageBars({
	points,
	granularity,
}: {
	points: readonly UsageBar[]
	granularity: Granularity
}) {
	const [hover, setHover] = useState<number | null>(null)
	const titleId = useId()

	if (points.length === 0) {
		return <div className="py-6 text-sm text-muted-foreground">Снимков за окно нет</div>
	}

	const max = Math.max(...points.map((d) => d.bytes), 1)
	const W = 640
	const slot = W / points.length
	const barW = Math.max(slot - BAR_GAP, 1)
	const active = hover === null ? null : points[hover]

	return (
		<figure className="m-0">
			<div className="relative">
				<svg
					viewBox={`0 0 ${W} ${H}`}
					className="w-full"
					role="img"
					aria-labelledby={titleId}
					onMouseLeave={() => setHover(null)}
				>
					<title id={titleId}>
						{granularity === 'hour' ? 'Расход по часам' : 'Расход по дням'}
					</title>
					{points.map((d, i) => {
						const h = Math.max((d.bytes / max) * (H - 18), d.bytes > 0 ? RADIUS : 0)
						return (
							<g key={d.bucket} onMouseEnter={() => setHover(i)}>
								{/* Прозрачная зона попадания шире самого столбца — по тонкой полоске
								    курсором не попасть. */}
								<rect x={i * slot} y={0} width={slot} height={H} fill="transparent" />
								<rect
									x={i * slot + BAR_GAP / 2}
									y={H - 18 - h}
									width={barW}
									height={h}
									rx={RADIUS}
									className={hover === i ? 'fill-viz-series-1' : 'fill-viz-series-1/70'}
								/>
							</g>
						)
					})}
					<line x1={0} x2={W} y1={H - 18} y2={H - 18} stroke="var(--viz-grid)" strokeWidth={1} />
					<text x={0} y={H - 4} className="fill-muted-foreground text-[9px] tabular-nums">
						{formatBucket(points[0]!.bucket, granularity)}
					</text>
					<text
						x={W}
						y={H - 4}
						textAnchor="end"
						className="fill-muted-foreground text-[9px] tabular-nums"
					>
						{formatBucket(points.at(-1)!.bucket, granularity)}
					</text>
				</svg>

				{active && (
					<div className="pointer-events-none absolute top-0 right-0 rounded-md bg-popover px-2 py-1 text-xs shadow-sm ring-1 ring-foreground/10">
						<span className="text-muted-foreground">
							{formatBucket(active.bucket, granularity)}
						</span>{' '}
						<span className="tabular-nums">{formatBytes(active.bytes)}</span>
					</div>
				)}
			</div>
		</figure>
	)
}
