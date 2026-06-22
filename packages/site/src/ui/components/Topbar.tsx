import { reatomComponent } from '@reatom/react'
import { Activity, House, Zap } from 'lucide-react'
import { navigate } from '@/state/screen.ts'

export const Topbar = reatomComponent(() => {
	return (
		<header className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
			<button
				className="inline-flex items-center gap-2 text-sm font-bold text-foreground hover:text-foreground/80 transition-colors"
				onClick={() => navigate('home')}
			>
				<Zap className="size-4 text-emerald-500" />
				Alesha Vpnov
			</button>
			<nav className="flex items-center gap-4 text-xs text-muted-foreground">
				<button
					className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
					onClick={() => navigate('home')}
				>
					<House className="size-3.5" />
					Главная
				</button>
				<button
					className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
					onClick={() => navigate('status')}
				>
					<Activity className="size-3.5" />
					Статус
				</button>
			</nav>
		</header>
	)
})
