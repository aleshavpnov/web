import { reatomComponent } from '@reatom/react'
import { navigate } from '@/state/screen.ts'

export const Topbar = reatomComponent(() => {
	return (
		<header className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
			<button
				className="text-sm font-bold text-foreground hover:text-foreground/80 transition-colors"
				onClick={() => navigate('home')}
			>
				Alesha Vpnov
			</button>
			<nav className="flex items-center gap-4 text-xs text-muted-foreground">
				<button
					className="hover:text-foreground transition-colors"
					onClick={() => navigate('home')}
				>
					Главная
				</button>
				<button
					className="hover:text-foreground transition-colors"
					onClick={() => navigate('status')}
				>
					Статус
				</button>
			</nav>
		</header>
	)
})
