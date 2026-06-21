import { reatomComponent } from '@reatom/react'
import { navigate } from '@/state/screen.ts'
import { statusAtom, statusErrorAtom } from '@/state/status.ts'
import { Topbar } from '@/ui/components/Topbar.tsx'
import { Footer } from '@/ui/components/Footer.tsx'
import type { StatusPayload } from '@/api/schemas.ts'

function healthDot(status: StatusPayload['overall']) {
	if (status === 'operational') return 'bg-emerald-500'
	if (status === 'degraded') return 'bg-amber-500'
	if (status === 'down') return 'bg-red-500'
	return 'bg-stone-500'
}

function healthLabel(status: StatusPayload['overall']) {
	if (status === 'operational') return 'Все системы работают'
	if (status === 'degraded') return 'Частичные проблемы'
	if (status === 'down') return 'Сбой'
	return 'Статус неизвестен'
}

function nodeDot(status: StatusPayload['overall']) {
	if (status === 'operational') return 'text-emerald-500'
	if (status === 'degraded') return 'text-amber-500'
	if (status === 'down') return 'text-red-500'
	return 'text-stone-500'
}

const MiniStatus = reatomComponent(() => {
	const status = statusAtom()
	const error = statusErrorAtom()

	if (error) {
		return (
			<div className="border border-border/60 rounded-xl p-4">
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<span className="w-2 h-2 rounded-full bg-stone-500 shrink-0" />
					Статус недоступен
				</div>
			</div>
		)
	}

	if (!status) {
		return (
			<div className="border border-border/60 rounded-xl p-4">
				<div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
					<span className="w-2 h-2 rounded-full bg-stone-500 shrink-0" />
					Загрузка статуса…
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
					className="text-xs text-muted-foreground hover:text-foreground transition-colors"
					onClick={() => navigate('status')}
				>
					подробнее →
				</button>
			</div>
			{status.nodes.length > 0 && (
				<div className="space-y-1.5 border-t border-border/40 pt-3">
					{status.nodes.map((node) => (
						<div key={node.name} className="flex items-center justify-between text-xs">
							<span className="flex items-center gap-1.5">
								<span className={`${nodeDot(node.status)} text-base leading-none`}>●</span>
								<span className="text-foreground/80">
									{node.name} · {node.city}
								</span>
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

export const Home = reatomComponent(() => {
	return (
		<div className="dark min-h-screen flex flex-col bg-stone-950 text-stone-50">
			<Topbar />
			<main className="flex-1 flex flex-col justify-center px-5 py-12 max-w-2xl mx-auto w-full gap-10">
				<div className="space-y-6">
					<p className="text-xs font-medium tracking-[0.2em] uppercase text-emerald-500">
						Частный доступ
					</p>
					<h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
						Своя сеть.
						<br />
						Без лишних глаз.
					</h1>
					<p className="text-base text-stone-400 max-w-sm leading-relaxed">
						Быстрое незаметное соединение на своих серверах.
					</p>
					<div className="flex items-center gap-3">
						<button
							className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
							onClick={() => navigate('access')}
						>
							Получить доступ
						</button>
						<button
							className="border border-stone-700 hover:border-stone-600 text-stone-400 hover:text-stone-300 text-sm px-5 py-2.5 rounded-lg transition-colors"
							onClick={() => navigate('status')}
						>
							Статус
						</button>
					</div>
				</div>
				<MiniStatus />
			</main>
			<Footer />
		</div>
	)
})
