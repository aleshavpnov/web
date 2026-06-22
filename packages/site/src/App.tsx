import { reatomComponent } from '@reatom/react'
import { useEffect } from 'react'
import { Toaster } from '@/components/ui/sonner.tsx'
import { screenAtom } from '@/state/screen.ts'
import { loadStatus } from '@/state/status.ts'
import { Home } from '@/ui/screens/Home.tsx'
import { Access } from '@/ui/screens/Access.tsx'
import { Status } from '@/ui/screens/Status.tsx'

export const App = reatomComponent(() => {
	useEffect(() => {
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
			{screen === 'access' ? <Access /> : screen === 'status' ? <Status /> : <Home />}
			<Toaster position="top-center" />
		</>
	)
})
