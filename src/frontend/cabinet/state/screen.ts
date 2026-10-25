/**
 * Навигация по hash (`#/connect`, `#/plans`).
 *
 * Адрес в хеше, а не в пути: приложение раздаётся из-под префикса `/me/`, и хеш работает
 * одинаково при любом префиксе и без rewrite на прокси. Плюс перезагрузка вебвью Telegram
 * возвращает на тот же экран.
 *
 * Но пишется он через History API. Присваивание `location.hash` — настоящая навигация
 * вебвью, и Telegram Desktop зажигает на ней индикатор загрузки навсегда: гасит он его по
 * событию завершения, а внутри документа такого события нет. `WebApp.ready()` не спасает —
 * десктоп эту команду не обрабатывает.
 */
import { atom } from '#frontend/lib/atom.ts'

export type ScreenName = 'home' | 'connect' | 'plans' | 'tariffs' | 'buy' | 'usage' | 'refs' | 'more'

export const SCREENS: readonly ScreenName[] = ['home', 'connect', 'plans', 'tariffs', 'buy', 'usage', 'refs', 'more']

/**
 * Экраны без своей вкладки: подстраницы. Возврат с них ведёт не на главную, а на родителя —
 * иначе «назад» из витрины тарифов выбрасывало бы из раздела целиком.
 */
export const SCREEN_PARENT: Partial<Record<ScreenName, ScreenName>> = {
	tariffs: 'plans',
	buy: 'tariffs',
}

export function screenFromHash(hash: string): ScreenName {
	const name = hash.replace(/^#\/?/, '').split('/')[0]

	return SCREENS.find((s) => s === name) ?? 'home'
}

/**
 * Второй сегмент хеша — параметр экрана (`#/buy/monthly` → «monthly»). Свой параметр
 * есть только у оформления и у диплинков подключения, остальные экраны сегмент игнорируют.
 */
export function paramFromHash(hash: string): string | null {
	return hash.replace(/^#\/?/, '').split('/')[1] || null
}

export function hashFromScreen(screen: ScreenName, param?: string | null): string {
	if (screen === 'home') return '#/'

	return param ? `#/${screen}/${param}` : `#/${screen}`
}

/** Заголовок экрана в шапке. */
export const SCREEN_TITLE: Record<ScreenName, string> = {
	home: 'Личный кабинет',
	connect: 'Подключение',
	plans: 'Тарифы',
	tariffs: 'Все тарифы',
	buy: 'Оформление',
	usage: 'Трафик',
	refs: 'Друзья',
	more: 'Ещё',
}

/** Корневой экран вкладки: подстраница подсвечивает вкладку предка. */
export function rootScreen(screen: ScreenName): ScreenName {
	let current = screen

	for (let parent = SCREEN_PARENT[current]; parent; parent = SCREEN_PARENT[current]) current = parent

	return current
}

/** Та часть `window`, что нужна роутеру: в тестах её подменяет заглушка. */
export type RouterWindow = {
	location: Pick<Location, 'hash' | 'search' | 'pathname'>
	history: Pick<History, 'pushState' | 'replaceState'>
	addEventListener(type: 'popstate' | 'hashchange', listener: () => void): void
	removeEventListener(type: 'popstate' | 'hashchange', listener: () => void): void
}

/**
 * Стартовый адрес: диплинк из бота (`?go=connect/refresh`) сильнее хеша.
 *
 * Раздел приезжает в query, потому что фрагмент у Mini App занят Telegram — клиент кладёт
 * туда `tgWebAppData`, и наш `#/...` до сюда не доезжает (см. cabinetUrlFor в конфиге бота).
 * Прочитав `go`, вычищаем его из адреса: иначе перезагрузка вебвью и «назад» вечно
 * возвращали бы человека на тот же экран, откуда он ушёл.
 */
export function initialRoute(win: RouterWindow): { screen: ScreenName; param: string | null } {
	const { location } = win
	const go = new URLSearchParams(location.search).get('go')

	if (!go) return { screen: screenFromHash(location.hash), param: paramFromHash(location.hash) }

	const route = { screen: screenFromHash(`#/${go}`), param: paramFromHash(`#/${go}`) }

	// Путь целиком, а не один хеш: относительный `#/...` оставил бы query на месте.
	win.history.replaceState(null, '', location.pathname + hashFromScreen(route.screen, route.param))

	return route
}

export const screenAtom = atom<ScreenName>('home')

/** Параметр текущего экрана — код тарифа на «Оформлении»; у остальных экранов null. */
export const screenParamAtom = atom<string | null>(null)

let routerWindow: RouterWindow | null = null

/**
 * Подключает роутер к окну: читает стартовый адрес и слушает «назад» браузера.
 * Возвращает отключение.
 */
export function startRouter(win: RouterWindow): () => void {
	routerWindow = win

	const start = initialRoute(win)

	screenAtom.set(start.screen)
	screenParamAtom.set(start.param)

	const sync = () => {
		screenAtom.set(screenFromHash(win.location.hash))
		screenParamAtom.set(paramFromHash(win.location.hash))
	}

	// popstate — потому что pushState не даёт hashchange; hashchange оставлен на случай смены
	// адреса снаружи. Оба слушателя ставят одно и то же значение, двойной вызов безвреден.
	win.addEventListener('popstate', sync)
	win.addEventListener('hashchange', sync)

	return () => {
		win.removeEventListener('popstate', sync)
		win.removeEventListener('hashchange', sync)

		if (routerWindow === win) routerWindow = null
	}
}

export function navigate(screen: ScreenName, param?: string): void {
	screenAtom.set(screen)
	screenParamAtom.set(param ?? null)

	const hash = hashFromScreen(screen, param)

	if (routerWindow && routerWindow.location.hash !== hash) routerWindow.history.pushState(null, '', hash)
}
