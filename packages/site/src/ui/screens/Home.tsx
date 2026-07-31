import { reatomComponent } from '@reatom/react'
import { Activity, ArrowRight, Gauge, Lock, Zap } from 'lucide-react'
import { navigate } from '@/state/screen.ts'
import { statusAtom, statusErrorAtom } from '@/state/status.ts'
import { Layout } from '@/ui/components/Layout.tsx'
import { VpnStatusBadge } from '@/ui/components/VpnStatusBadge.tsx'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip.tsx'
import { ctaClass } from '@/ui/cta.ts'
import { formatMbps } from '@/lib/format.ts'
import type { StatusPayload } from '@/api/schemas.ts'

function healthDot(status: StatusPayload['overall']) {
	if (status === 'operational') return 'bg-emerald-500'
	if (status === 'degraded') return 'bg-amber-500'
	if (status === 'down') return 'bg-red-500'
	return 'bg-muted-foreground/40'
}

function healthLabel(status: StatusPayload['overall']) {
	if (status === 'operational') return 'Всё работает'
	if (status === 'degraded') return 'Частичные проблемы'
	if (status === 'down') return 'Сбой'
	return 'Статус неизвестен'
}

function nodeDot(status: StatusPayload['overall']) {
	if (status === 'operational') return 'text-emerald-500'
	if (status === 'degraded') return 'text-amber-500'
	if (status === 'down') return 'text-red-500'
	return 'text-muted-foreground'
}

const MiniStatus = reatomComponent(() => {
	const status = statusAtom()
	const error = statusErrorAtom()

	if (error) {
		return (
			<div className="border border-border/60 rounded-xl p-4">
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<span className="w-2 h-2 rounded-full bg-muted-foreground/40 shrink-0" />
					Статус недоступен
				</div>
			</div>
		)
	}

	if (!status) {
		return (
			<div className="border border-border/60 rounded-xl p-4 space-y-3">
				<div className="flex h-5 items-center justify-between">
					<div className="flex items-center gap-2">
						<Skeleton className="size-2 rounded-full" />
						<Skeleton className="h-4 w-32" />
					</div>
					<Skeleton className="h-3 w-16" />
				</div>
				<div className="space-y-1.5 border-t border-border/40 pt-3">
					{['a', 'b'].map((k) => (
						<div key={k} className="flex h-4 items-center justify-between">
							<Skeleton className="h-3 w-24" />
							<Skeleton className="h-3 w-10" />
						</div>
					))}
				</div>
			</div>
		)
	}

	return (
		<div className="border border-border/60 rounded-xl p-4 space-y-3">
			<div className="flex items-center justify-between text-sm">
				<span className="flex items-center gap-2">
					<span className={`w-2 h-2 rounded-full shrink-0 ${healthDot(status.overall)}`} />
					<span
						className={status.overall === 'operational' ? 'text-emerald-400' : 'text-foreground'}
					>
						{healthLabel(status.overall)}
					</span>
				</span>
				<button
					className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
					onClick={() => navigate('status')}
				>
					подробнее <ArrowRight className="size-3.5" />
				</button>
			</div>
			{status.nodes.length > 0 && (
				<div className="space-y-1.5 border-t border-border/40 pt-3">
					{status.nodes.map((node, i) => (
						<div key={i} className="flex items-center justify-between text-xs">
							<span className="flex items-center gap-1.5">
								<span className={`${nodeDot(node.status)} text-base leading-none`}>●</span>
								<span className="text-foreground/70">{node.label}</span>
							</span>
							{node.uptime.d1 !== null && (
								<span className="text-muted-foreground tabular-nums">
									{Math.round(node.uptime.d1 * 10) / 10}%
								</span>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	)
})

const metricClass =
	'inline-flex items-center gap-1 mx-1 align-baseline whitespace-nowrap text-emerald-500'

const Tagline = reatomComponent(() => {
	const status = statusAtom()
	// Пик — основное число; на старом кэше без peakBps откатываемся на среднее.
	const peakBps = status?.traffic?.peakBps ?? status?.traffic?.avgBps ?? null
	const avgBps = status?.traffic?.avgBps ?? null
	const pingMs = status?.internet?.latencyMs ?? null

	if (peakBps === null || pingMs === null) {
		return (
			<p className="text-base text-muted-foreground max-w-sm leading-relaxed">
				Тихое и&nbsp;быстрое соединение без&nbsp;ограничений.
			</p>
		)
	}

	return (
		<p className="text-base text-muted-foreground max-w-sm leading-relaxed">
			Быстрое соединение без&nbsp;ограничений со&nbsp;скоростью до{' '}
			<Tooltip>
				<TooltipTrigger
					className={`${metricClass} cursor-help rounded-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50`}
				>
					<Gauge className="size-3.5" />
					<span className="tabular-nums font-medium">{formatMbps(peakBps)}&nbsp;Мбит/с</span>
				</TooltipTrigger>
				{avgBps !== null && (
					<TooltipContent>
						Средняя за&nbsp;сегодня — {formatMbps(avgBps)}&nbsp;Мбит/с
					</TooltipContent>
				)}
			</Tooltip>{' '}
			и&nbsp;пингом{' '}
			<span className={metricClass}>
				<Activity className="size-3.5" />
				<span className="tabular-nums font-medium">{pingMs}&nbsp;мс</span>
			</span>{' '}
			за&nbsp;сегодня
		</p>
	)
})

export const Home = reatomComponent(() => {
	return (
		<Layout>
			<main className="flex-1 flex flex-col justify-center px-4 py-12 w-full gap-6">
				<div className="space-y-6">
					<p className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.2em] uppercase text-emerald-500">
						<Lock className="size-3.5" />
						Частный доступ
					</p>
					<h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
						Ваше ради кальное решение проблем
					</h1>
					<Tagline />
					<div>
						<button className={ctaClass} onClick={() => navigate('access')}>
							<Zap className="size-4" />
							Получить доступ
						</button>
					</div>
					<VpnStatusBadge />
				</div>
				<MiniStatus />
			</main>
		</Layout>
	)
})
