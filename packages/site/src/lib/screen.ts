export type Screen =
	| 'home'
	| 'access'
	| 'status'
	| 'faq'
	| 'privacy'
	| 'terms'
	| 'app'
	| 'appAdd'
	| 'notfound'

const PATH_TO_SCREEN: Record<string, Screen> = {
	'/': 'home',
	'/get': 'access',
	'/status': 'status',
	'/faq': 'faq',
	'/privacy': 'privacy',
	'/terms': 'terms',
	'/app': 'app',
	'/app/add': 'appAdd',
}
const SCREEN_TO_PATH: Record<Screen, string> = {
	home: '/',
	access: '/get',
	status: '/status',
	faq: '/faq',
	privacy: '/privacy',
	terms: '/terms',
	app: '/app',
	appAdd: '/app/add',
	notfound: '/',
}

export function screenFromPath(pathname: string): Screen {
	return PATH_TO_SCREEN[pathname] ?? 'notfound'
}
export function pathFromScreen(screen: Screen): string {
	return SCREEN_TO_PATH[screen]
}
