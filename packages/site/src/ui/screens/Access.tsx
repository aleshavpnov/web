import { reatomComponent } from '@reatom/react'
import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { Check, Clock, Copy, Download, Plus, Power, Route, Send, Shield, Zap } from 'lucide-react'
import QRCode from 'qrcode'
import { toast } from 'sonner'
import {
	bridgeAtom,
	bridgeBusyAtom,
	bridgeErrorAtom,
	expireBridge,
	requestBridge,
} from '@/state/bridge.ts'
import { navigate } from '@/state/screen.ts'
import { Layout } from '@/ui/components/Layout.tsx'
import { ctaClass } from '@/ui/cta.ts'

// Логотип Happ (https://happ.su/imgs/logo_small.svg), перекрашивается через currentColor.
function HappIcon({ className }: { className?: string }) {
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

// Название клиента как ссылка на его сайт, с фирменной иконкой.
function ClientLink({ client }: { client: ClientConfig }) {
	const Icon = client.Icon
	return (
		<a
			href={client.site}
			target="_blank"
			rel="noopener noreferrer"
			className="inline-flex items-center gap-1 font-semibold text-emerald-500 hover:text-emerald-400 underline underline-offset-2"
		>
			<Icon className="h-[0.95em] w-auto shrink-0 no-underline" />
			{client.name}
		</a>
	)
}

// Компактная CTA-кнопка «Скачать» — на отдельной строке под текстом шага.
const downloadBtnClass =
	'flex w-fit items-center gap-1.5 mt-2 bg-emerald-500 hover:bg-emerald-400 ' +
	'text-white font-semibold text-xs uppercase tracking-wide px-3 py-1.5 rounded-md ' +
	'transition-all hover:shadow-md hover:shadow-emerald-500/30 active:scale-95'

// Заголовок шага — заметный emerald-бейдж, чтобы шаги не терялись.
const stepBadgeClass =
	'inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-bold uppercase tracking-wider text-emerald-500'

// CTA-кнопка копирования — по высоте инпута (items-stretch), только иконка.
const copyBtnClass =
	'inline-flex items-center justify-center shrink-0 px-3.5 bg-emerald-500 ' +
	'hover:bg-emerald-400 text-white rounded-lg transition-all duration-200 ' +
	'hover:shadow-lg hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0'

// Инлайн-чип, имитирующий кнопку интерфейса Happ/Incy внутри текста инструкции.
// Размер задаётся в месте вызова: иконочные чипы — size-5, кнопка с подписью — px/py.
function InlineKey({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<span
			className={`inline-flex items-center justify-center gap-1 mx-1 align-middle border ${className}`}
		>
			{children}
		</span>
	)
}

function DownloadButton({ href, device }: { href: string; device: string }) {
	return (
		<a href={href} target="_blank" rel="noopener noreferrer" className={downloadBtnClass}>
			<Download className="size-3.5" />
			Скачать для {device}
		</a>
	)
}

// CTA-кнопка «Добавить» — открывает routing-страницу клиента, которая ставит маршруты обхода.
function RoutingButton({ href }: { href: string }) {
	return (
		<a href={href} target="_blank" rel="noopener noreferrer" className={downloadBtnClass}>
			<Route className="size-3.5" />
			Добавить
		</a>
	)
}

// Общее модальное окно: затемнённый оверлей + центрированная панель, закрытие по Escape/клику вне.
function Dialog({
	open,
	title,
	onClose,
	children,
}: {
	open: boolean
	title: string
	onClose: () => void
	children: ReactNode
}) {
	useEffect(() => {
		if (!open) return
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		}
		document.addEventListener('keydown', onKey)
		return () => document.removeEventListener('keydown', onKey)
	}, [open, onClose])

	if (!open) return null

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
			role="dialog"
			aria-modal="true"
		>
			<div className="absolute inset-0 bg-black/50" onClick={onClose} />
			<div className="relative z-10 w-full max-w-xs rounded-xl border border-border bg-background p-4 shadow-xl">
				<p className="text-sm font-semibold mb-3">{title}</p>
				<div className="flex flex-col gap-1">{children}</div>
			</div>
		</div>
	)
}

// Магазины приложений: кнопка открывает поповер с выбором (iOS у обоих, а у Incy и Mac).
function StoreDownloadButton({ stores, device }: { stores: Store[]; device: string }) {
	const [open, setOpen] = useState(false)
	const itemClass =
		'flex items-center rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors'

	return (
		<>
			<button type="button" className={downloadBtnClass} onClick={() => setOpen(true)}>
				<Download className="size-3.5" />
				Скачать для {device}
			</button>
			<Dialog open={open} title="Выберите магазин" onClose={() => setOpen(false)}>
				{stores.map((s) => (
					<a
						key={s.href}
						href={s.href}
						target="_blank"
						rel="noopener noreferrer"
						onClick={() => setOpen(false)}
						className={itemClass}
					>
						{s.label}
					</a>
				))}
			</Dialog>
		</>
	)
}

// Настройка маршрутов через routing-страницу клиента (после установки приложения).
function routingStep(client: ClientConfig): ReactNode {
	return (
		<>
			Для работы внутри&nbsp;РФ нужны маршруты: <RoutingButton href={client.routingUrl} />
		</>
	)
}

// Шаги: добавляем полученную ссылку-подписку в приложение клиента и включаем подключение.
// У Incy кнопка «Вставить» добавляет подписку из буфера за один тап, поэтому отдельного
// шага «Добавить из буфера» (как у Happ) для него нет.
function connectSteps(client: ClientConfig): { step: string; text: ReactNode }[] {
	const addText =
		client.id === 'incy' ? (
			<>
				Скопируйте ссылку-подписку и&nbsp;добавьте её в&nbsp;{client.name}: справа снизу нажмите{' '}
				<InlineKey className="rounded border-border bg-muted text-foreground px-1.5 py-0.5 text-xs font-medium">
					<Copy className="size-3.5" />
					Вставить
				</InlineKey>
			</>
		) : (
			<>
				Скопируйте ссылку-подписку и&nbsp;добавьте её в&nbsp;{client.name}: справа сверху нажмите{' '}
				<InlineKey className="size-5 rounded border-border bg-muted text-foreground">
					<Plus className="size-3.5" />
				</InlineKey>
			</>
		)

	const texts: ReactNode[] = [addText]
	if (client.id !== 'incy') {
		texts.push(<>Выберите «Добавить из&nbsp;буфера»</>)
	}
	texts.push(
		<>
			Нажмите кнопку подключения{' '}
			<InlineKey className="size-5 rounded-full border-emerald-500/40 bg-emerald-500/15 text-emerald-500">
				<Power className="size-3" />
			</InlineKey>
		</>,
	)

	return texts.map((text, i) => ({ step: String(i + 1), text }))
}

function friendlyError(e: string) {
	if (e === 'rate-limit') return 'Слишком много запросов — попробуйте позже.'
	return 'Не удалось получить доступ. Попробуйте позже.'
}

function useCountdown(expiresAt: string | null) {
	const [remaining, setRemaining] = useState('')

	useEffect(() => {
		if (!expiresAt) return
		const tick = () => {
			const diff = new Date(expiresAt).getTime() - Date.now()
			if (diff <= 0) {
				// Срок вышел: сбрасываем bridge целиком — панель вернётся к кнопке
				// «Получить временный доступ», мёртвую ссылку не показываем.
				expireBridge()
				return
			}
			const h = Math.floor(diff / 3_600_000)
			const m = Math.floor((diff % 3_600_000) / 60_000)
			const s = Math.floor((diff % 60_000) / 1000)
			setRemaining(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
		}
		tick()
		const id = setInterval(tick, 1000)
		return () => clearInterval(id)
	}, [expiresAt])

	return remaining
}

type Platform = 'ios' | 'android' | 'windows' | 'mac'

const platforms: { key: Platform; label: string }[] = [
	{ key: 'ios', label: 'iOS' },
	{ key: 'android', label: 'Android' },
	{ key: 'windows', label: 'Windows' },
	{ key: 'mac', label: 'Mac' },
]

type Client = 'incy' | 'happ' // порядок в тогглере задаётся ниже (HAPP слева, дефолт)

type Store = { label: string; href: string }

// Способ установки клиента на конкретной платформе.
type InstallMethod =
	| { kind: 'stores'; device: string; stores: Store[] } // диалог выбора магазина
	| { kind: 'direct'; href: string; device: string } // прямая кнопка «Скачать для …»
	| { kind: 'unavailable' } // нет версии под платформу

interface ClientConfig {
	id: Client
	name: string
	site: string
	routingUrl: string
	Icon: ComponentType<{ className?: string }>
	install: Record<Platform, InstallMethod>
}

// Incy на iOS и Mac ставится из App Store по одной и той же ссылке.
const incyStores: Store[] = [
	{ label: '🇷🇺 RU App Store', href: 'https://apps.apple.com/ru/app/incy/id6756943388' },
	{ label: '🇺🇸 US App Store', href: 'https://apps.apple.com/us/app/incy/id6756943388' },
]

const CLIENTS: Record<Client, ClientConfig> = {
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
						href: 'https://apps.apple.com/ru/app/happ-proxy-utility/id6783623643',
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
}

// Пометка для платформы, под которую у клиента нет версии (Windows у Incy).
function UnavailableNote({ name, siteHref }: { name: string; siteHref: string }) {
	return (
		<>
			{name} пока недоступен для&nbsp;этой платформы.{' '}
			<a
				href={siteHref}
				target="_blank"
				rel="noopener noreferrer"
				className="text-emerald-500 hover:text-emerald-400 underline underline-offset-2"
			>
				Открыть сайт
			</a>
		</>
	)
}

// Шаг 1 (установка) — единственный платформо-зависимый шаг, формируется по способу установки.
function renderInstall(method: InstallMethod, client: ClientConfig): ReactNode {
	if (method.kind === 'stores')
		return (
			<>
				Установите приложение <StoreDownloadButton stores={method.stores} device={method.device} />
			</>
		)
	if (method.kind === 'direct')
		return (
			<>
				Установите приложение <DownloadButton href={method.href} device={method.device} />
			</>
		)
	return <UnavailableNote name={client.name} siteHref={client.site} />
}

// Определяем платформу пользователя, чтобы сразу открыть нужную вкладку гайда.
function detectPlatform(): Platform {
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

const defaultPlatform = detectPlatform()

// QR имеет смысл только там, где Telegram-аккаунт живёт на другом устройстве.
const isDesktop = defaultPlatform === 'windows' || defaultPlatform === 'mac'

const BridgePanel = reatomComponent(() => {
	const bridge = bridgeAtom()
	const busy = bridgeBusyAtom()
	const error = bridgeErrorAtom()
	const countdown = useCountdown(bridge?.expiresAt ?? null)

	useEffect(() => {
		if (error) toast.error(friendlyError(error))
	}, [error])

	const copyUrl = async () => {
		if (!bridge?.subscriptionUrl) return
		await navigator.clipboard.writeText(bridge.subscriptionUrl)
		toast.success('Ссылка скопирована')
	}

	// Без раннего return: оба состояния живут в одной обёртке фиксированной
	// высоты, поэтому shortUrl вычисляем с guard на отсутствие bridge.
	const shortUrl =
		bridge && bridge.subscriptionUrl.length > 42
			? bridge.subscriptionUrl.slice(0, 42) + '…'
			: (bridge?.subscriptionUrl ?? '')

	// min-h резервирует высоту панельного состояния, чтобы при переключении
	// кнопка↔панель список-инструкция ниже не прыгал; justify-center даёт
	// кнопке симметричный отступ сверху и снизу.
	return (
		<div className="flex flex-col justify-center min-h-[4.375rem]">
			{!bridge ? (
				<button
					disabled={busy}
					className={`${ctaClass} cta-glow`}
					onClick={() => void requestBridge()}
				>
					<Zap className="size-4" />
					{busy ? 'Получаем доступ…' : 'Получить временный доступ'}
				</button>
			) : (
				<div className="space-y-2">
					<div className="flex items-center justify-between gap-2">
						<p className="text-xs text-muted-foreground uppercase tracking-wider">
							ссылка-подписка
						</p>
						<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
							<Clock className="size-3.5 text-amber-500 shrink-0" />
							<span className="text-foreground tabular-nums font-medium">{countdown}</span>
						</div>
					</div>

					<div className="flex items-stretch gap-2">
						<div className="flex-1 min-w-0 bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground/80 overflow-hidden text-ellipsis whitespace-nowrap font-mono">
							{shortUrl}
						</div>
						<button
							className={copyBtnClass}
							onClick={() => void copyUrl()}
							aria-label="Копировать ссылку"
						>
							<Copy className="size-4" />
						</button>
					</div>
				</div>
			)}
		</div>
	)
})

// Шаг 3: открыть бота в Telegram. Ссылка приходит с бэкенда после получения доступа,
// поэтому без доступа кнопка неактивна. На десктопе рядом QR с тем же deep-link:
// телефон сканирует и открывает бота с токеном привязки (кросс-девайс сценарий).
const TelegramBlock = reatomComponent(() => {
	const bridge = bridgeAtom()
	const [qr, setQr] = useState<string | null>(null)
	const deepLink = bridge?.deepLink ?? null

	useEffect(() => {
		if (!deepLink || !isDesktop) {
			setQr(null)
			return
		}
		let alive = true
		// width 320 = 2x от отображаемых 160px, чтобы не мылился на ретине
		QRCode.toDataURL(deepLink, { margin: 1, width: 320 })
			.then((url) => {
				if (alive) setQr(url)
			})
			.catch(() => {
				if (alive) setQr(null)
			})
		return () => {
			alive = false
		}
	}, [deepLink])

	return (
		<div className="border border-border rounded-xl p-5">
			<div className="mb-2">
				<span className={stepBadgeClass}>Шаг 3</span>
			</div>
			<p className="text-sm text-muted-foreground leading-relaxed mb-4">
				Перейдите в&nbsp;бота в&nbsp;Telegram и&nbsp;активируйте подписку.
			</p>
			{bridge ? (
				<>
					<a href={bridge.deepLink} className={ctaClass}>
						<Send className="size-4" />
						Открыть в Telegram
					</a>
					{qr && (
						<div className="mt-4 flex items-center gap-4">
							<img
								src={qr}
								alt="QR-код: открыть бота в Telegram"
								className="size-40 shrink-0 rounded-lg bg-white p-2"
							/>
							<p className="text-sm text-muted-foreground leading-relaxed">
								Или отсканируйте с&nbsp;телефона — бот откроется сразу с&nbsp;привязкой вашего
								доступа.
							</p>
						</div>
					)}
				</>
			) : (
				<button
					type="button"
					className={`${ctaClass} opacity-50`}
					onClick={() => toast.info('Сначала получите доступ на шаге 2.')}
				>
					<Send className="size-4" />
					Открыть в Telegram
				</button>
			)}
		</div>
	)
})

function PlatformDialog({
	open,
	current,
	onSelect,
	onClose,
}: {
	open: boolean
	current: Platform
	onSelect: (p: Platform) => void
	onClose: () => void
}) {
	return (
		<Dialog open={open} title="Выберите платформу" onClose={onClose}>
			{platforms.map((p) => (
				<button
					key={p.key}
					type="button"
					onClick={() => {
						onSelect(p.key)
						onClose()
					}}
					className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
						p.key === current
							? 'bg-emerald-500/10 text-emerald-500 font-semibold'
							: 'text-foreground hover:bg-muted'
					}`}
				>
					{p.label}
					{p.key === current && <Check className="size-4" />}
				</button>
			))}
		</Dialog>
	)
}

export const Access = reatomComponent(() => {
	const [client, setClient] = useState<Client>('happ')
	const [activeTab, setActiveTab] = useState(defaultPlatform)
	const [dialogOpen, setDialogOpen] = useState(false)
	const cfg = CLIENTS[client]

	return (
		<Layout>
			<main className="flex-1 px-4 py-8 w-full">
				<div className="mb-6">
					<p className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.2em] uppercase text-emerald-500 mb-2">
						<Clock className="size-3.5" />
						пробный доступ · 3&nbsp;часа
					</p>
					<h1 className="text-2xl font-bold tracking-tight">Получение доступа</h1>
				</div>

				{/* Тогглер клиента: переключает все ссылки и название приложения в инструкции. */}
				<div className="inline-flex rounded-lg border border-border p-0.5 mb-6">
					{(['happ', 'incy'] as Client[]).map((c) => {
						const Icon = CLIENTS[c].Icon
						return (
							<button
								key={c}
								type="button"
								onClick={() => setClient(c)}
								className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-semibold uppercase tracking-wide transition-colors ${
									c === client
										? 'bg-emerald-500/10 text-emerald-500'
										: 'text-muted-foreground hover:text-foreground'
								}`}
							>
								<Icon className="h-4 w-auto shrink-0" />
								{CLIENTS[c].name}
							</button>
						)
					})}
				</div>

				<div className="flex flex-col gap-4">
					{/* Шаг 1: установка и настройка Happ */}
					<div className="border border-border rounded-xl p-5">
						<div className="flex items-center justify-between gap-3 mb-2">
							<span className={stepBadgeClass}>Шаг 1</span>
							<button
								type="button"
								onClick={() => setDialogOpen(true)}
								className="text-xs text-emerald-500 hover:text-emerald-400 underline underline-offset-2"
							>
								другое устройство?
							</button>
						</div>
						<p className="text-sm text-muted-foreground leading-relaxed mb-4">
							Установите и&nbsp;настройте <ClientLink client={cfg} /> — приложение,
							через&nbsp;которое работает ваше соединение.
						</p>
						<ol className="space-y-3">
							<li className="flex gap-2 items-start">
								<span className="text-emerald-500 font-bold text-sm leading-relaxed w-4 shrink-0">
									1
								</span>
								<span className="text-sm text-foreground/80 leading-relaxed">
									{renderInstall(cfg.install[activeTab], cfg)}
								</span>
							</li>
							<li className="flex gap-2 items-start">
								<span className="text-emerald-500 font-bold text-sm leading-relaxed w-4 shrink-0">
									2
								</span>
								<span className="text-sm text-foreground/80 leading-relaxed">
									{routingStep(cfg)}
								</span>
							</li>
						</ol>
					</div>

					{/* Шаг 2: получить ссылку-подписку и добавить в Happ */}
					<div className="border border-border rounded-xl p-5">
						<div className="mb-2">
							<span className={stepBadgeClass}>Шаг 2</span>
						</div>
						<p className="text-sm text-muted-foreground leading-relaxed mb-4">
							Получите временную ссылку-подписку
							<br />
							и&nbsp;добавьте её в&nbsp;{cfg.name}.
						</p>
						<BridgePanel />
						<ol className="space-y-3 mt-4">
							{connectSteps(cfg).map(({ step, text }) => (
								<li key={step} className="flex gap-2 items-start">
									<span className="text-emerald-500 font-bold text-sm leading-relaxed w-4 shrink-0">
										{step}
									</span>
									<span className="text-sm text-foreground/80 leading-relaxed">{text}</span>
								</li>
							))}
						</ol>
					</div>

					{/* Шаг 3: открыть в Telegram */}
					<TelegramBlock />
				</div>

				<div className="border border-border rounded-xl p-5 mt-8">
					<p className="font-semibold text-sm mb-1">Есть вопросы?</p>
					<p className="text-sm text-muted-foreground leading-relaxed mb-4">
						В&nbsp;FAQ собраны ответы про тариф и&nbsp;оплату, пробный период, поддерживаемые
						устройства и&nbsp;типичные проблемы с&nbsp;подключением.
					</p>
					<button className={ctaClass} onClick={() => navigate('faq')}>
						Открыть FAQ
					</button>
				</div>

				<div className="mt-6">
					<button
						className="text-sm text-muted-foreground hover:text-foreground transition-colors"
						onClick={() => navigate('home')}
					>
						← На главную
					</button>
				</div>
				<PlatformDialog
					open={dialogOpen}
					current={activeTab}
					onSelect={setActiveTab}
					onClose={() => setDialogOpen(false)}
				/>
			</main>
		</Layout>
	)
})
