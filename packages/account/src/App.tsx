import { reatomComponent } from '@reatom/react'
import { useEffect } from 'react'

import { Toaster } from '@/components/ui/sonner.tsx'
import { colorScheme, insideTelegram, onColorSchemeChange, setBackButton } from '@/lib/telegram.ts'
import { themeAtom } from '@/state/cabinet.ts'
import { navigate, screenAtom, SCREEN_TITLE } from '@/state/screen.ts'
import { Nav } from '@/ui/components/Nav.tsx'
import { Connect } from '@/ui/screens/Connect.tsx'
import { Home } from '@/ui/screens/Home.tsx'
import { More } from '@/ui/screens/More.tsx'
import { Plans } from '@/ui/screens/Plans.tsx'
import { Referrals } from '@/ui/screens/Referrals.tsx'
import { Usage } from '@/ui/screens/Usage.tsx'

export const App = reatomComponent(() => {
	const screen = screenAtom()

	// Тему диктует Telegram (в браузере — системная): держим класс на <html> в синхроне.
	useEffect(() => {
		const apply = () => {
			const scheme = colorScheme()
			themeAtom.set(scheme)
			document.documentElement.classList.toggle('dark', scheme === 'dark')
		}
		apply()
		return onColorSchemeChange(apply)
	}, [])

	// Системная кнопка «назад» ведёт на главный экран: вкладки — плоские, вложенности нет.
	useEffect(() => {
		return setBackButton(screen === 'home' ? null : () => navigate('home'))
	}, [screen])

	// Новый экран начинается сверху: документ тот же (меняется только хеш), и с длинной
	// страницы трафика переход уводил бы в середину следующей.
	useEffect(() => {
		window.scrollTo({ top: 0 })
	}, [screen])

	return (
		<div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4">
			{!insideTelegram() && (
				<p className="mt-4 mb-3 rounded-lg bg-viz-warning/15 px-3 py-2 text-xs">
					Открыто вне Telegram: подписи initData нет. Работает только с дев-обходом на боте (
					<code>CABINET_TMA_DEV_TGID</code>).
				</p>
			)}

			<header className="pt-4 pb-1">
				<h1 className="text-lg font-bold">{SCREEN_TITLE[screen]}</h1>
			</header>

			<main className="flex-1 pt-3">
				{screen === 'connect' ? (
					<Connect />
				) : screen === 'plans' ? (
					<Plans />
				) : screen === 'usage' ? (
					<Usage />
				) : screen === 'refs' ? (
					<Referrals />
				) : screen === 'more' ? (
					<More />
				) : (
					<Home />
				)}
			</main>

			<Nav />
			<Toaster position="top-center" />
		</div>
	)
}, 'App')
