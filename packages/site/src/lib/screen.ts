export type Screen = 'home' | 'access' | 'status'

const PATH_TO_SCREEN: Record<string, Screen> = {
	'/': 'home',
	'/get': 'access',
	'/status': 'status',
}
const SCREEN_TO_PATH: Record<Screen, string> = { home: '/', access: '/get', status: '/status' }

export function screenFromPath(pathname: string): Screen {
	return PATH_TO_SCREEN[pathname] ?? 'home'
}
export function pathFromScreen(screen: Screen): string {
	return SCREEN_TO_PATH[screen]
}
