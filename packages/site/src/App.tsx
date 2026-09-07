import { reatomComponent } from '@reatom/react'
import { useEffect } from 'react'
import { Toaster } from '@/components/ui/sonner.tsx'
import { screenAtom } from '@/state/screen.ts'
import { loadStatus } from '@/state/status.ts'
import { Home } from '@/ui/screens/Home.tsx'
import { Access } from '@/ui/screens/Access.tsx'
import { Status } from '@/ui/screens/Status.tsx'
import { Faq } from '@/ui/screens/Faq.tsx'
import { Privacy } from '@/ui/screens/Privacy.tsx'
import { Terms } from '@/ui/screens/Terms.tsx'
import { NotFound } from '@/ui/screens/NotFound.tsx'
import { AppDownload } from '@/ui/screens/AppDownload.tsx'
import { AppAdd } from '@/ui/screens/AppAdd.tsx'

export const App = reatomComponent(() => {
	useEffect(() => {
		// Голый index.html обезличен (нейтральный title против не-JS-сканеров) — брендовую
		// вкладку возвращаем живому пользователю здесь. Неиндексацию держит meta robots, не title.
		document.title = 'Alesha Vepenov'
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
			) : screen === 'privacy' ? (
				<Privacy />
			) : screen === 'terms' ? (
				<Terms />
			) : screen === 'app' ? (
				<AppDownload />
			) : screen === 'appAdd' ? (
				<AppAdd />
			) : screen === 'notfound' ? (
				<NotFound />
			) : (
				<Home />
			)}
			<Toaster position="top-center" />
		</>
	)
})
