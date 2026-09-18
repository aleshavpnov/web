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
import { action, atom } from '@reatom/core'

export type ScreenName =
	| 'home'
	| 'connect'
	| 'plans'
	| 'tariffs'
	| 'buy'
	| 'usage'
	| 'refs'
	| 'more'

const SCREENS: readonly ScreenName[] = [
	'home',
	'connect',
	'plans',
	'tariffs',
	'buy',
	'usage',
	'refs',
	'more',
]

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
 * есть только у оформления, остальные экраны сегмент игнорируют.
 */
export function paramFromHash(hash: string): string | null {
	return hash.replace(/^#\/?/, '').split('/')[1] || null
}

export function hashFromScreen(screen: ScreenName, param?: string | null): string {
	if (screen === 'home') return '#/'
	return param ? `#/${screen}/${param}` : `#/${screen}`
}

/** Заголовок экрана в шапке. Главный экран заголовка не имеет — там карточка подписки. */
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

/**
 * Стартовый адрес: диплинк из бота (`?go=connect/refresh`) сильнее хеша.
 *
 * Раздел приезжает в query, потому что фрагмент у Mini App занят Telegram — клиент кладёт
 * туда `tgWebAppData`, и наш `#/...` до сюда не доезжает (см. cabinetUrlFor в конфиге бота).
 * Прочитав `go`, вычищаем его из адреса: иначе перезагрузка вебвью и «назад» вечно
 * возвращали бы человека на тот же экран, откуда он ушёл.
 */
function initialRoute(): { screen: ScreenName; param: string | null } {
	const go = new URLSearchParams(window.location.search).get('go')
	if (!go) {
		return {
			screen: screenFromHash(window.location.hash),
			param: paramFromHash(window.location.hash),
		}
	}
	const route = { screen: screenFromHash(`#/${go}`), param: paramFromHash(`#/${go}`) }
	// Путь целиком, а не один хеш: относительный `#/...` оставил бы query на месте.
	const clean = window.location.pathname + hashFromScreen(route.screen, route.param)
	window.history.replaceState(null, '', clean)
	return route
}

const START = initialRoute()

export const screenAtom = atom<ScreenName>(START.screen, 'screen')

/** Параметр текущего экрана — код тарифа на «Оформлении»; у остальных экранов null. */
export const screenParamAtom = atom<string | null>(START.param, 'screenParam')

export const navigate = action((screen: ScreenName, param?: string) => {
	screenAtom.set(screen)
	screenParamAtom.set(param ?? null)
	const hash = hashFromScreen(screen, param)
	if (window.location.hash !== hash) window.history.pushState(null, '', hash)
}, 'navigate')

const syncFromUrl = () => {
	screenAtom.set(screenFromHash(window.location.hash))
	screenParamAtom.set(paramFromHash(window.location.hash))
}

// popstate — потому что pushState не даёт hashchange; hashchange оставлен на случай смены
// адреса снаружи. Оба слушателя ставят одно и то же значение, двойной вызов безвреден.
window.addEventListener('popstate', syncFromUrl)
window.addEventListener('hashchange', syncFromUrl)
