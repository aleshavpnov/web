import { reatomComponent } from '@reatom/react'
import { useEffect } from 'react'
import { Toaster } from '@/components/ui/sonner.tsx'
import { screenAtom } from '@/state/screen.ts'
import { loadStatus } from '@/state/status.ts'
import { Home } from '@/ui/screens/Home.tsx'
import { Access } from '@/ui/screens/Access.tsx'
import { Status } from '@/ui/screens/Status.tsx'
import { Faq } from '@/ui/screens/Faq.tsx'
import { NotFound } from '@/ui/screens/NotFound.tsx'

export const App = reatomComponent(() => {
	useEffect(() => {
		// Голый index.html обезличен (нейтральный title против не-JS-сканеров) — брендовую
		// вкладку возвращаем живому пользователю здесь. Неиндексацию держит meta robots, не title.
		document.title = 'Alesha Vpnov'
		const loader = document.getElementById('initial-loader')
		if (loader) {
			loader.classList.add('is-hiding')
			setTimeout(() => loader.remove(), 250)
		}
		void loadStatus()
	}, [])

	const screen = screenAtom()

	return (
		<>
			{screen === 'access' ? (
				<Access />
			) : screen === 'status' ? (
				<Status />
			) : screen === 'faq' ? (
				<Faq />
			) : screen === 'notfound' ? (
				<NotFound />
			) : (
				<Home />
			)}
			<Toaster position="top-center" />
		</>
	)
})
