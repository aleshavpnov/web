/**
 * Каталог VPN-клиентов и платформ — единственный источник правды о том, откуда качать
 * приложение и как в нём настраиваются маршруты.
 *
 * Живёт в общем пакете, потому что одну и ту же инструкцию показывают двое: лендинг
 * (`packages/site`, шаг «получение доступа») и кабинет (`packages/account`, экран
 * «Подключение»). Разъехавшиеся ссылки на App Store — это разъехавшаяся поддержка.
 */
import type { ComponentType } from 'react'
import { Shield, Zap } from 'lucide-react'

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

export interface ClientConfig {
	id: ClientId
	name: string
	site: string
	/** Страница с маршрутами обхода. Нет у своего клиента — маршруты зашиты в подписку. */
	routingUrl?: string
	Icon: ComponentType<{ className?: string }>
	install: Record<Platform, InstallMethod>
}

/** Логотип Happ (https://happ.su/imgs/logo_small.svg), перекрашивается через currentColor. */
export function HappIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 32 39"
			fill="currentColor"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			aria-hidden="true"
		>
			<path d="M12.2983 4.41131L1.79344 14.9383L4.19455 0H13.1987L12.2983 4.41131Z" />
			<path d="M13.5989 4.81234L3.09405 15.3393L0 34.5887L10.5048 24.0617L10.7305 22.6581H12.0982L18.7012 16.0411H11.794L13.5989 4.81234Z" />
			<path d="M18.4011 34.1877L28.906 23.6607L32 4.41131L21.4952 14.9383L21.2695 16.3419H19.9018L13.2988 22.9589H20.206L18.4011 34.1877Z" />
			<path d="M30.3066 4.41131L19.8018 14.9383L22.2029 0H31.207L30.3066 4.41131Z" />
			<path d="M1.59335 34.5887L12.0982 24.0617L9.69709 39H0.692936L1.59335 34.5887Z" />
			<path d="M19.6017 34.5887L30.1065 24.0617L27.7054 39H18.7012L19.6017 34.5887Z" />
		</svg>
	)
}

/** Incy на iOS и Mac ставится из App Store по одной и той же ссылке. */
const incyStores: Store[] = [
	{ label: '🇷🇺 RU App Store', href: 'https://apps.apple.com/ru/app/incy/id6756943388' },
	{ label: '🇺🇸 US App Store', href: 'https://apps.apple.com/us/app/incy/id6756943388' },
]

/** Свежий APK своего клиента: релизы живут в публичном репо, latest — без версии в URL. */
export const APP_APK_URL =
	'https://github.com/aimuzov/aleshavpnov-releases/releases/latest/download/app-release.apk'
export const APP_RELEASES_URL = 'https://github.com/aimuzov/aleshavpnov-releases/releases'

export const CLIENTS: Record<ClientId, ClientConfig> = {
	incy: {
		id: 'incy',
		name: 'Incy',
		site: 'https://incy.cc/',
		routingUrl: 'https://incy.routing.help/',
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
		routingUrl: 'https://routing.help/',
		Icon: HappIcon,
		install: {
			ios: {
				kind: 'stores',
				device: 'iOS',
				stores: [
					{
						label: '🇷🇺 RU App Store',
						href: 'https://apps.apple.com/ru/app/happ-lite/id6799917773',
					},
					{
						label: '🇺🇸 US App Store',
						href: 'https://apps.apple.com/us/app/happ-proxy-utility/id6504287215',
					},
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
		site: 'https://durov.aimuzov.online/app',
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
	if (
		/iphone|ipad|ipod/i.test(ua) ||
		(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
	)
		return 'ios'
	if (/macintosh|mac os x/i.test(ua)) return 'mac'
	return 'windows'
}
