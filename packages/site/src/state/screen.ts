import { action, atom } from '@reatom/core'
import { pathFromScreen, screenFromPath, type Screen } from '@/lib/screen.ts'

export const screenAtom = atom<Screen>(screenFromPath(window.location.pathname), 'screen')

export const navigate = action((screen: Screen) => {
	screenAtom.set(screen)
	const path = pathFromScreen(screen)
	if (window.location.pathname !== path) window.history.pushState(null, '', path)
}, 'navigate')

window.addEventListener('popstate', () => screenAtom.set(screenFromPath(window.location.pathname)))
