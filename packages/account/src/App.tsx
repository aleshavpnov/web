import { reatomComponent } from '@reatom/react'
import { useEffect } from 'react'
import { ArrowLeftIcon, HouseIcon } from 'lucide-react'

import { Toaster } from '@/components/ui/sonner.tsx'
import { colorScheme, insideTelegram, onColorSchemeChange, setBackButton } from '@/lib/telegram.ts'
import { themeAtom } from '@/state/cabinet.ts'
import {
	navigate,
	screenAtom,
	SCREEN_PARENT,
	SCREEN_TITLE,
	type ScreenName,
} from '@/state/screen.ts'
import { canGoBack, stepAtom, wizardBack } from '@/state/wizard.ts'
import { LoadingBar } from '@/ui/components/LoadingBar.tsx'
import { Nav } from '@/ui/components/Nav.tsx'
import { Connect } from '@/ui/screens/Connect.tsx'
import { Home } from '@/ui/screens/Home.tsx'
import { More } from '@/ui/screens/More.tsx'
import { Plans } from '@/ui/screens/Plans.tsx'
import { Referrals } from '@/ui/screens/Referrals.tsx'
import { Tariffs } from '@/ui/screens/Tariffs.tsx'
import { Usage } from '@/ui/screens/Usage.tsx'

export const App = reatomComponent(() => {
	const screen = screenAtom()
	const step = stepAtom()

	// Куда ведёт «назад»: шаг подбора, если он есть; с подстраницы — к её родителю; иначе на
	// главную. На главной возвращаться некуда.
	const backTarget: 'step' | ScreenName | null =
		screen === 'plans' && canGoBack(step)
			? 'step'
			: screen === 'home'
				? null
				: (SCREEN_PARENT[screen] ?? 'home')

	function goBack() {
		if (backTarget === 'step') wizardBack()
		else if (backTarget) navigate(backTarget)
	}

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

	// Системная кнопка Telegram и стрелка в шапке ведут себя одинаково: сначала шаг назад
	// внутри подбора тарифа, и только когда возвращаться внутри экрана некуда — на главную.
	// Иначе кнопка «назад» на третьем шаге выбрасывала бы с экрана целиком.
	useEffect(() => {
		if (screen === 'home') return setBackButton(null)
		return setBackButton(() => {
			if (screen === 'plans' && wizardBack()) return
			navigate(SCREEN_PARENT[screen] ?? 'home')
		})
		// step в зависимостях: обработчик читает шаг в момент установки, и без пересборки
		// системная кнопка застряла бы на состоянии первого рендера.
	}, [screen, step])

	// Новый экран начинается сверху: документ тот же (меняется только хеш), и с длинной
	// страницы трафика переход уводил бы в середину следующей.
	useEffect(() => {
		window.scrollTo({ top: 0 })
	}, [screen])

	return (
		<div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4">
			<LoadingBar />

			{!insideTelegram() && (
				<p className="mt-4 mb-3 rounded-lg bg-viz-warning/15 px-3 py-2 text-xs">
					Открыто вне Telegram: подписи initData нет. Работает только с дев-обходом на боте (
					<code>CABINET_TMA_DEV_TGID</code>).
				</p>
			)}

			{/*
			 * Слева от заголовка всегда одно и то же место: стрелка «назад» там, где есть
			 * куда возвращаться, и иконка экрана на главной. Раньше на главной слот
			 * отсутствовал — заголовок съезжал влево и менял высоту шапки, отчего экран
			 * дёргался при каждом возврате.
			 *
			 * Стрелка дублирует системную кнопку Telegram: та есть не везде (десктоп,
			 * браузер) и уходит из поля зрения, когда листаешь экран.
			 */}
			<header className="flex items-center gap-1 pt-4 pb-1">
				{backTarget ? (
					<button
						type="button"
						aria-label="Назад"
						onClick={goBack}
						className="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-lg text-brand hover:bg-muted"
					>
						<ArrowLeftIcon className="size-5" />
					</button>
				) : (
					<span aria-hidden className="-ml-2 flex size-11 shrink-0 items-center justify-center">
						<HouseIcon className="size-5 text-brand" />
					</span>
				)}
				<h1 className="text-lg font-bold">{SCREEN_TITLE[screen]}</h1>
			</header>

			<main className="flex-1 pt-3">
				{screen === 'connect' ? (
					<Connect />
				) : screen === 'plans' ? (
					<Plans />
				) : screen === 'tariffs' ? (
					<Tariffs />
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
