/**
 * Каталог VPN-клиентов и платформ — единственный источник правды о том, откуда качать
 * приложение и как в нём настраиваются маршруты.
 *
 * Одну и ту же инструкцию показывают двое: страница получения доступа на сайте и экран
 * «Подключение» в кабинете. Разъехавшиеся ссылки на App Store — это разъехавшаяся поддержка.
 */
import { Shield, Zap, type LucideIcon } from '@lucide/svelte'

import HappIcon from './happ-icon.svelte'

export type Platform = 'ios' | 'android' | 'windows' | 'mac'

export const platforms: { key: Platform; label: string }[] = [
	{ key: 'ios', label: 'iOS' },
	{ key: 'android', label: 'Android' },
	{ key: 'windows', label: 'Windows' },
	{ key: 'mac', label: 'Mac' },
]

/** Порядок в тогглере: Happ слева и по умолчанию. */
export const CLIENT_ORDER = ['happ', 'incy'] as const

/**
 * Свой Android-клиент пока не показываем людям: он дорабатывается. Запись в CLIENTS
 * остаётся — по ней живёт страница-мост /app/add и ответ API, где клиент уже опознан.
 */
export const HIDDEN_CLIENTS = ['aleshavpnov'] as const

export type ClientId = (typeof CLIENT_ORDER)[number] | (typeof HIDDEN_CLIENTS)[number]

/** Клиент из ответа API, если его вообще показываем; иначе null. */
export function visibleApp(id: string | null | undefined): ClientId | null {
	return CLIENT_ORDER.find((c) => c === id) ?? null
}

export type Store = { label: string; href: string }

/** Способ установки клиента на конкретной платформе. */
export type InstallMethod =
	| { kind: 'stores'; device: string; stores: Store[] } // диалог выбора магазина
	| { kind: 'direct'; href: string; device: string } // прямая кнопка «Скачать для …»
	| { kind: 'unavailable' } // нет версии под платформу

export type ClientConfig = {
	id: ClientId
	name: string
	site: string
	Icon: LucideIcon
	install: Record<Platform, InstallMethod>
}

/** Incy на iOS и Mac ставится из App Store по одной и той же ссылке. */
const incyStores: Store[] = [
	{ label: '🇷🇺 RU App Store', href: 'https://apps.apple.com/ru/app/incy/id6756943388' },
	{ label: '🇺🇸 US App Store', href: 'https://apps.apple.com/us/app/incy/id6756943388' },
]

/** Свежий APK своего клиента: релизы живут в публичном репо, latest — без версии в URL. */
export const APP_APK_URL = 'https://github.com/aimuzov/aleshavpnov-releases/releases/latest/download/app-release.apk'
export const APP_RELEASES_URL = 'https://github.com/aimuzov/aleshavpnov-releases/releases'

export const CLIENTS: Record<ClientId, ClientConfig> = {
	incy: {
		id: 'incy',
		name: 'Incy',
		site: 'https://incy.cc/',
		Icon: Shield,
		install: {
			ios: { kind: 'stores', device: 'iOS', stores: incyStores },
			android: {
				kind: 'direct',
				href: 'https://play.google.com/store/apps/details?id=llc.itdev.incy&hl=ru',
				device: 'Android',
			},
			windows: { kind: 'unavailable' },
			mac: { kind: 'stores', device: 'Mac', stores: incyStores },
		},
	},
	happ: {
		id: 'happ',
		name: 'Happ',
		site: 'https://happ.su',
		// Свой SVG принимает те же class и size, что иконки lucide.
		Icon: HappIcon as unknown as LucideIcon,
		install: {
			ios: {
				kind: 'stores',
				device: 'iOS',
				stores: [
					{ label: '🇷🇺 RU App Store', href: 'https://apps.apple.com/ru/app/happ-lite/id6799917773' },
					{ label: '🇺🇸 US App Store', href: 'https://apps.apple.com/us/app/happ-proxy-utility/id6504287215' },
				],
			},
			android: {
				kind: 'direct',
				href: 'https://play.google.com/store/apps/details?id=com.happproxy',
				device: 'Android',
			},
			windows: {
				kind: 'direct',
				href: 'https://github.com/Happ-proxy/happ-desktop/releases/latest/download/setup-Happ.x64.exe',
				device: 'Windows',
			},
			mac: {
				kind: 'direct',
				href: 'https://github.com/Happ-proxy/happ-desktop/releases/latest/download/Happ.macOS.universal.dmg',
				device: 'Mac',
			},
		},
	},
	aleshavpnov: {
		id: 'aleshavpnov',
		name: 'Alesha Vpnov',
		site: 'https://aleshavpnov.ru/app',
		Icon: Zap,
		install: {
			ios: { kind: 'unavailable' },
			android: { kind: 'direct', href: APP_APK_URL, device: 'Android' },
			windows: { kind: 'unavailable' },
			mac: { kind: 'unavailable' },
		},
	},
}

/** Платформа пользователя — чтобы сразу открыть нужную вкладку инструкции. */
export function detectPlatform(): Platform {
	if (typeof navigator === 'undefined') return 'ios'

	const ua = navigator.userAgent

	if (/android/i.test(ua)) return 'android'

	// iPhone/iPad/iPod + iPadOS 13+, который выдаёт себя за Mac (но с тачскрином).
	if (/iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
		return 'ios'

	if (/macintosh|mac os x/i.test(ua)) return 'mac'

	return 'windows'
}

/**
 * Якоря для подсветки: по ним кабинет находит цель, на которую пришёл человек по диплинку
 * из подсказки бота. Атрибут, а не проп: инструкция общая с сайтом, а подсветка нужна
 * только кабинету.
 */
export const SPOTLIGHT_ATTR = 'data-spotlight'
export type SpotlightTarget = 'refresh'
