import { reatomComponent } from '@reatom/react'
import { Activity, House, Monitor, Moon, Sun, Zap } from 'lucide-react'
import { navigate } from '@/state/screen.ts'
import { themeAtom, setTheme, type ThemeMode } from '@/state/theme.ts'

const NEXT_MODE: Record<ThemeMode, ThemeMode> = {
	system: 'light',
	light: 'dark',
	dark: 'system',
}

const NEXT_LABEL: Record<ThemeMode, string> = {
	system: 'Switch to light mode',
	light: 'Switch to dark mode',
	dark: 'Switch to system mode',
}

function ThemeIcon({ mode }: { mode: ThemeMode }) {
	if (mode === 'light') return <Sun className="size-4" />
	if (mode === 'dark') return <Moon className="size-4" />
	return <Monitor className="size-4" />
}

export const Topbar = reatomComponent(() => {
	const mode = themeAtom()

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
				<button
					className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
					aria-label={NEXT_LABEL[mode]}
					onClick={() => setTheme(NEXT_MODE[mode])}
				>
					<ThemeIcon mode={mode} />
				</button>
			</nav>
		</header>
	)
})
