/**
 * Навигация по hash (`#/connect`, `#/plans`).
 *
 * Не pushState: приложение раздаётся из-под префикса `/me/`, и hash работает одинаково при
 * любом префиксе и без правил rewrite на прокси. Плюс перезагрузка вебвью Telegram
 * возвращает на тот же экран.
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
	if (window.location.hash !== hash) window.location.hash = hash
}, 'navigate')

window.addEventListener('hashchange', () => screenAtom.set(screenFromHash(window.location.hash)))
