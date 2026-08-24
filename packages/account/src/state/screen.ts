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

export type ScreenName = 'home' | 'connect' | 'plans' | 'tariffs' | 'usage' | 'refs' | 'more'

const SCREENS: readonly ScreenName[] = [
	'home',
	'connect',
	'plans',
	'tariffs',
	'usage',
	'refs',
	'more',
]

/**
 * Экраны без своей вкладки: подстраницы. Возврат с них ведёт не на главную, а на родителя —
 * иначе «назад» из витрины тарифов выбрасывало бы из подписки целиком.
 */
export const SCREEN_PARENT: Partial<Record<ScreenName, ScreenName>> = {
	tariffs: 'plans',
}

export function screenFromHash(hash: string): ScreenName {
	const name = hash.replace(/^#\/?/, '').split('/')[0]
	return SCREENS.find((s) => s === name) ?? 'home'
}

export function hashFromScreen(screen: ScreenName): string {
	return screen === 'home' ? '#/' : `#/${screen}`
}

/** Заголовок экрана в шапке. Главный экран заголовка не имеет — там карточка подписки. */
export const SCREEN_TITLE: Record<ScreenName, string> = {
	home: 'Личный кабинет',
	connect: 'Подключение',
	plans: 'Подписка',
	tariffs: 'Тарифы',
	usage: 'Трафик',
	refs: 'Друзья',
	more: 'Ещё',
}

export const screenAtom = atom<ScreenName>(screenFromHash(window.location.hash), 'screen')

export const navigate = action((screen: ScreenName) => {
	screenAtom.set(screen)
	const hash = hashFromScreen(screen)
	if (window.location.hash !== hash) window.history.pushState(null, '', hash)
}, 'navigate')

const syncFromUrl = () => screenAtom.set(screenFromHash(window.location.hash))

// popstate — потому что pushState не даёт hashchange; hashchange оставлен на случай смены
// адреса снаружи. Оба слушателя ставят одно и то же значение, двойной вызов безвреден.
window.addEventListener('popstate', syncFromUrl)
window.addEventListener('hashchange', syncFromUrl)
