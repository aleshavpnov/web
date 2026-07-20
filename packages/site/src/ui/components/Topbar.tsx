import { reatomComponent } from '@reatom/react'
import { Activity, CircleHelp, House, Monitor, Moon, Sun, Zap } from 'lucide-react'
import { navigate, screenAtom } from '@/state/screen.ts'
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

// Активный пункт навигации подсвечиваем фирменным emerald; неактивный — приглушён с hover.
function navItemClass(active: boolean) {
	return `inline-flex items-center gap-1.5 transition-colors ${
		active ? 'text-emerald-500' : 'hover:text-foreground'
	}`
}

function ThemeIcon({ mode }: { mode: ThemeMode }) {
	if (mode === 'light') return <Sun className="size-4" />
	if (mode === 'dark') return <Moon className="size-4" />
	return <Monitor className="size-4" />
}

export const Topbar = reatomComponent(() => {
	const mode = themeAtom()
	const screen = screenAtom()

	return (
		<header className="flex items-center justify-between px-4 py-3.5 border-b border-border/50">
			<button
				className="inline-flex items-center gap-2 text-sm font-bold whitespace-nowrap text-foreground hover:text-foreground/80 transition-colors"
				onClick={() => navigate('home')}
			>
				<Zap className="size-4 text-emerald-500" />
				Alesha Vpnov
			</button>
			<nav className="flex items-center gap-4 text-xs text-muted-foreground">
				<button
					className={navItemClass(screen === 'home')}
					aria-current={screen === 'home' ? 'page' : undefined}
					onClick={() => navigate('home')}
				>
					<House className="size-3.5 max-[420px]:hidden" />
					Главная
				</button>
				<button
					className={navItemClass(screen === 'status')}
					aria-current={screen === 'status' ? 'page' : undefined}
					onClick={() => navigate('status')}
				>
					<Activity className="size-3.5 max-[420px]:hidden" />
					Статус
				</button>
				<button
					className={navItemClass(screen === 'faq')}
					aria-current={screen === 'faq' ? 'page' : undefined}
					onClick={() => navigate('faq')}
				>
					<CircleHelp className="size-3.5 max-[420px]:hidden" />
					FAQ
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
