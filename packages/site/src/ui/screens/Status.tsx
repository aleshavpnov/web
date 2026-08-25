import { reatomComponent } from '@reatom/react'
import { Activity } from 'lucide-react'
import { useEffect } from 'react'
import { statusAtom, statusErrorAtom, loadStatus } from '@/state/status.ts'
import { BackLink } from '@/ui/components/BackLink.tsx'
import { Layout } from '@/ui/components/Layout.tsx'
import { Bone, TrackBone } from '@shared/skeleton/index.ts'
import type { StatusNode, StatusIncident, StatusPayload } from '@/api/schemas.ts'

function overallBg(status: StatusPayload['overall']) {
	if (status === 'operational') return 'bg-emerald-500/10 border-emerald-500/40'
	if (status === 'degraded') return 'bg-amber-500/10 border-amber-500/40'
	if (status === 'down') return 'bg-red-500/10 border-red-500/40'
	return 'bg-muted border-border'
}

function overallText(status: StatusPayload['overall']) {
	if (status === 'operational') return 'text-emerald-400'
	if (status === 'degraded') return 'text-amber-400'
	if (status === 'down') return 'text-red-400'
	return 'text-muted-foreground'
}

function overallLabel(status: StatusPayload['overall']) {
	if (status === 'operational') return '● Всё работает'
	if (status === 'degraded') return '◐ Частичные проблемы'
	if (status === 'down') return '● Сбой'
	return '○ Статус неизвестен'
}

function nodeDot(status: StatusNode['status']) {
	if (status === 'operational') return 'text-emerald-500'
	if (status === 'degraded') return 'text-amber-500'
	if (status === 'down') return 'text-red-500'
	return 'text-muted-foreground'
}

function formatPct(v: number | null) {
	if (v === null) return '—'
	return `${(Math.round(v * 10) / 10).toFixed(1)}%`
}

function UptimeBars({ bars }: { bars: StatusNode['bars'] }) {
	// Show up to 90 days
	const cells = bars.slice(-90)
	return (
		<div className="flex gap-px items-end h-5">
			{cells.map((bar, i) => {
				let color = 'bg-muted'
				if (bar.ratio === null) color = 'bg-muted'
				else if (bar.ratio >= 0.99) color = 'bg-emerald-500'
				else if (bar.ratio >= 0.5) color = 'bg-amber-500'
				else color = 'bg-red-500'
				return (
					<div
						key={i}
						title={bar.day}
						className={`flex-1 min-w-0 rounded-sm ${color}`}
						style={{ height: bar.ratio !== null ? `${Math.max(40, bar.ratio * 100)}%` : '40%' }}
					/>
				)
			})}
		</div>
	)
}

function NodeCard({ node }: { node: StatusNode }) {
	return (
		<div className="border border-border rounded-xl p-5 space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className={`text-base leading-none ${nodeDot(node.status)}`}>●</span>
					<span className="font-semibold text-sm">{node.label}</span>
				</div>
				{node.uptime.d1 !== null && (
					<span className="text-xs text-muted-foreground tabular-nums">
						{formatPct(node.uptime.d1)} / 24ч
					</span>
				)}
			</div>

			{node.bars.length > 0 && (
				<div className="space-y-1.5">
					<UptimeBars bars={node.bars} />
					<div className="flex justify-between items-center">
						<span className="text-xs text-muted-foreground/60">90 дней</span>
					</div>
				</div>
			)}

			<div className="flex gap-6 text-xs text-muted-foreground">
				<span>
					24ч <span className="text-foreground font-medium">{formatPct(node.uptime.d1)}</span>
				</span>
				<span>
					7д <span className="text-foreground font-medium">{formatPct(node.uptime.d7)}</span>
				</span>
				<span>
					30д <span className="text-foreground font-medium">{formatPct(node.uptime.d30)}</span>
				</span>
			</div>
		</div>
	)
}

// Mirrors NodeCard's layout so the loading state reserves the same height
// (header 20 / bars block 42 / stats 16, inside p-5 + space-y-4). The uptime strip is
// drawn cell by cell — a single bar read as a paragraph, not as 90 days of history.
function NodeCardSkeleton() {
	return (
		<div className="border border-border rounded-xl p-5 space-y-4">
			<div className="flex h-5 items-center justify-between">
				<div className="flex items-center gap-2">
					<Bone className="size-2 rounded-full" />
					<Bone className="h-4 w-24" />
				</div>
				<Bone className="h-3 w-16" />
			</div>
			<div className="space-y-1.5">
				<TrackBone className="h-5 items-end" />
				<div className="flex h-4 items-center">
					<Bone className="h-3 w-12" />
				</div>
			</div>
			<div className="flex h-4 items-center">
				<Bone className="h-3 w-44" />
			</div>
		</div>
	)
}

function StatusSkeleton() {
	return (
		<>
			<div className="border border-border rounded-xl px-5 h-[54px] flex items-center justify-between">
				<Bone className="h-4 w-44" />
				<Bone className="h-3 w-12" />
			</div>
			<div className="space-y-3">
				<NodeCardSkeleton />
				<NodeCardSkeleton />
			</div>
			{/* Reserves the height of the incidents line ("Инцидентов нет") below */}
			<Bone className="h-5 w-64" />
		</>
	)
}

function IncidentItem({ incident }: { incident: StatusIncident }) {
	const resolved = incident.status === 'resolved' || incident.resolvedAt !== null
	return (
		<div className="border border-border rounded-lg px-4 py-3 space-y-1">
			<div className="flex items-center justify-between gap-2">
				<span className="text-sm font-medium">{incident.title}</span>
				<span
					className={`text-xs px-2 py-0.5 rounded-full ${
						resolved ? 'bg-muted text-muted-foreground' : 'bg-amber-500/20 text-amber-400'
					}`}
				>
					{resolved ? 'закрыто' : incident.status}
				</span>
			</div>
			{incident.body && (
				<p className="text-xs text-muted-foreground leading-relaxed">{incident.body}</p>
			)}
			{incident.startedAt && (
				<p className="text-xs text-muted-foreground/60">
					{new Date(incident.startedAt).toLocaleDateString('ru-RU', {
						day: 'numeric',
						month: 'long',
						year: 'numeric',
					})}
					{incident.location ? ` · ${incident.location}` : ''}
				</p>
			)}
		</div>
	)
}

export const Status = reatomComponent(() => {
	const status = statusAtom()
	const error = statusErrorAtom()

	// Periodic refetch
	useEffect(() => {
		const id = setInterval(() => void loadStatus(), 60_000)
		return () => clearInterval(id)
	}, [])

	return (
		<Layout>
			<main className="flex-1 px-4 py-8 w-full space-y-6">
				<div className="flex items-end justify-between">
					<div>
						<p className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.2em] uppercase text-emerald-500 mb-2">
							<Activity className="size-3.5" />
							серверы · аптайм · инциденты
						</p>
						<h1 className="text-2xl font-bold tracking-tight">Статус системы</h1>
					</div>
					{status && (
						<span className="text-xs text-muted-foreground/60">
							обновлено{' '}
							{new Date(status.generatedAt).toLocaleTimeString('ru-RU', {
								hour: '2-digit',
								minute: '2-digit',
							})}
						</span>
					)}
				</div>

				{/* Overall banner */}
				{error ? (
					<div className="border border-border rounded-xl px-5 py-4 flex items-center gap-3">
						<span className="w-2 h-2 rounded-full bg-muted-foreground/40 shrink-0" />
						<span className="text-sm text-muted-foreground">Статус недоступен</span>
					</div>
				) : !status ? (
					<StatusSkeleton />
				) : (
					<>
						<div
							className={`border rounded-xl px-5 py-4 flex items-center justify-between ${overallBg(status.overall)}`}
						>
							<span className={`text-sm font-semibold ${overallText(status.overall)}`}>
								{overallLabel(status.overall)}
							</span>
							{status.internet?.latencyMs !== null && status.internet?.latencyMs !== undefined && (
								<span className="text-xs text-muted-foreground tabular-nums">
									{status.internet.latencyMs} мс
								</span>
							)}
						</div>

						{/* Node cards */}
						{status.nodes.length > 0 && (
							<div className="space-y-3">
								{status.nodes.map((node, i) => (
									<NodeCard key={i} node={node} />
								))}
							</div>
						)}

						{/* Incidents */}
						{status.incidents.length > 0 ? (
							<div className="space-y-2">
								<h2 className="text-sm font-semibold text-muted-foreground">Инциденты</h2>
								{status.incidents.map((inc) => (
									<IncidentItem key={inc.id} incident={inc} />
								))}
							</div>
						) : (
							<p className="text-sm text-muted-foreground/60">
								Инцидентов за последние 30 дней нет
							</p>
						)}
					</>
				)}

				<div>
					<BackLink />
				</div>
			</main>
		</Layout>
	)
})
