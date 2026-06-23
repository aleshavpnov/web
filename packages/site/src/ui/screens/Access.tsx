import { reatomComponent } from '@reatom/react'
import { useEffect, useState, type ReactNode } from 'react'
import { Check, Clock, Copy, Download, Plus, Power, Route, Send, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { bridgeAtom, bridgeBusyAtom, bridgeErrorAtom, requestBridge } from '@/state/bridge.ts'
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

// Название приложения как ссылка на сайт с логотипом.
function HappLink() {
	return (
		<a
			href="https://happ.su"
			target="_blank"
			rel="noopener noreferrer"
			className="inline-flex items-center gap-1 font-semibold text-emerald-500 hover:text-emerald-400 underline underline-offset-2"
		>
			<HappIcon className="h-[0.95em] w-auto shrink-0 no-underline" />
			Happ
		</a>
	)
}

// Компактная CTA-кнопка «Скачать» с небольшим отступом слева от текста.
const downloadBtnClass =
	'inline-flex items-center gap-1.5 ml-2 align-[-0.2em] bg-emerald-500 hover:bg-emerald-400 ' +
	'text-white font-semibold text-xs uppercase tracking-wide px-3 py-1.5 rounded-md ' +
	'transition-all hover:shadow-md hover:shadow-emerald-500/30 active:scale-95'

// Заголовок шага — заметный emerald-бейдж, чтобы шаги не терялись.
const stepBadgeClass =
	'inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-bold uppercase tracking-wider text-emerald-500'

// Инлайн-чип, имитирующий кнопку интерфейса Happ внутри текста инструкции.
function InlineKey({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<span
			className={`inline-flex items-center justify-center size-5 mx-1 align-middle border ${className}`}
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

// CTA-кнопка «Добавить» — открывает routing.help, который ставит в Happ маршруты обхода.
function RoutingButton() {
	return (
		<a
			href="https://routing.help/"
			target="_blank"
			rel="noopener noreferrer"
			className={downloadBtnClass}
		>
			<Route className="size-3.5" />
			Добавить
		</a>
	)
}

// iOS доступен в двух магазинах — кнопка открывает поповер с выбором.
const iosStores = [
	{
		label: '🇷🇺 RU App Store',
		href: 'https://apps.apple.com/ru/app/happ-proxy-utility-plus/id6746188973',
	},
	{
		label: '🇺🇸 US App Store',
		href: 'https://apps.apple.com/us/app/happ-proxy-utility/id6504287215',
	},
]

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

function IosDownloadButton() {
	const [open, setOpen] = useState(false)

	return (
		<>
			<button type="button" className={downloadBtnClass} onClick={() => setOpen(true)}>
				<Download className="size-3.5" />
				Скачать для iOS
			</button>
			<Dialog open={open} title="Выберите магазин" onClose={() => setOpen(false)}>
				{iosStores.map((s) => (
					<a
						key={s.href}
						href={s.href}
						target="_blank"
						rel="noopener noreferrer"
						onClick={() => setOpen(false)}
						className="flex items-center rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
					>
						{s.label}
					</a>
				))}
			</Dialog>
		</>
	)
}

// Шаг 1: настройка маршрутов через routing.help (после установки Happ).
const routingStep: ReactNode = (
	<>
		Для работы внутри&nbsp;РФ надо <RoutingButton /> маршруты для&nbsp;обхода.
	</>
)

// Шаг 2: добавляем полученную ссылку-подписку в Happ и включаем подключение.
const connectSteps: { step: string; text: ReactNode }[] = [
	{
		step: '1',
		text: (
			<>
				Скопируйте ссылку-подписку и&nbsp;добавьте её в&nbsp;Happ: справа сверху нажмите{' '}
				<InlineKey className="rounded border-border bg-muted text-foreground">
					<Plus className="size-3.5" />
				</InlineKey>
			</>
		),
	},
	{
		step: '2',
		text: <>Выберите «Добавить из&nbsp;буфера»</>,
	},
	{
		step: '3',
		text: (
			<>
				Нажмите кнопку подключения{' '}
				<InlineKey className="rounded-full border-emerald-500/40 bg-emerald-500/15 text-emerald-500">
					<Power className="size-3" />
				</InlineKey>
			</>
		),
	},
]

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
				setRemaining('истёк')
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

// Установка Happ — единственный платформо-зависимый шаг (Шаг 1).
const installSteps: Record<Platform, ReactNode> = {
	ios: (
		<>
			Установите приложение <IosDownloadButton />
		</>
	),
	android: (
		<>
			Установите приложение{' '}
			<DownloadButton
				href="https://play.google.com/store/apps/details?id=com.happproxy"
				device="Android"
			/>
		</>
	),
	windows: (
		<>
			Установите приложение{' '}
			<DownloadButton
				href="https://github.com/Happ-proxy/happ-desktop/releases/latest/download/setup-Happ.x64.exe"
				device="Windows"
			/>
		</>
	),
	mac: (
		<>
			Установите приложение{' '}
			<DownloadButton
				href="https://github.com/Happ-proxy/happ-desktop/releases/latest/download/Happ.macOS.universal.dmg"
				device="Mac"
			/>
		</>
	),
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

	if (!bridge) {
		return (
			<button
				disabled={busy}
				className={`${ctaClass} cta-glow`}
				onClick={() => void requestBridge()}
			>
				<Zap className="size-4" />
				{busy ? 'Получаем доступ…' : 'Получить временный доступ'}
			</button>
		)
	}

	const shortUrl =
		bridge.subscriptionUrl.length > 42
			? bridge.subscriptionUrl.slice(0, 42) + '…'
			: bridge.subscriptionUrl

	return (
		<div className="space-y-4">
			<div className="space-y-1.5">
				<p className="text-xs text-muted-foreground uppercase tracking-wider">ссылка-подписка</p>
				<div className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground/80 overflow-hidden text-ellipsis whitespace-nowrap font-mono">
					{shortUrl}
				</div>
			</div>

			<button
				className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-semibold px-3 py-2.5 rounded-lg transition-colors"
				onClick={() => void copyUrl()}
			>
				<Copy className="size-4" />
				Копировать
			</button>

			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<Clock className="size-3.5 text-amber-500 shrink-0" />
				Истекает через{' '}
				<span className="text-foreground tabular-nums font-medium">{countdown}</span>
			</div>
		</div>
	)
})

// Шаг 3: открыть бота в Telegram. Ссылка приходит с бэкенда после получения доступа,
// поэтому без доступа кнопка неактивна.
const TelegramBlock = reatomComponent(() => {
	const bridge = bridgeAtom()

	return (
		<div className="border border-border rounded-xl p-5">
			<div className="mb-2">
				<span className={stepBadgeClass}>Шаг 3</span>
			</div>
			<p className="text-sm text-muted-foreground leading-relaxed mb-4">
				Перейдите в&nbsp;бота в&nbsp;Telegram и&nbsp;активируйте подписку.
			</p>
			{bridge ? (
				<a href={bridge.deepLink} className={ctaClass}>
					<Send className="size-4" />
					Открыть в Telegram
				</a>
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
	const [activeTab, setActiveTab] = useState(defaultPlatform)
	const [dialogOpen, setDialogOpen] = useState(false)

	return (
		<Layout>
			<main className="flex-1 px-5 py-8 w-full">
				<div className="mb-6">
					<p className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.2em] uppercase text-emerald-500 mb-2">
						<Clock className="size-3.5" />
						пробный доступ · 3&nbsp;часа
					</p>
					<h1 className="text-2xl font-bold tracking-tight">Получение доступа</h1>
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
							Установите и&nbsp;настройте <HappLink /> — приложение, через&nbsp;которое работает
							ваше соединение.
						</p>
						<ol className="space-y-3">
							<li className="flex gap-3 items-start">
								<span className="text-emerald-500 font-bold text-sm w-4 shrink-0">1</span>
								<span className="text-sm text-foreground/80 leading-relaxed">
									{installSteps[activeTab]}
								</span>
							</li>
							<li className="flex gap-3 items-start">
								<span className="text-emerald-500 font-bold text-sm w-4 shrink-0">2</span>
								<span className="text-sm text-foreground/80 leading-relaxed">{routingStep}</span>
							</li>
						</ol>
					</div>

					{/* Шаг 2: получить ссылку-подписку и добавить в Happ */}
					<div className="border border-border rounded-xl p-5">
						<div className="mb-2">
							<span className={stepBadgeClass}>Шаг 2</span>
						</div>
						<p className="text-sm text-muted-foreground leading-relaxed mb-4">
							Получите временную ссылку-подписку и&nbsp;добавьте её в&nbsp;Happ.
						</p>
						<BridgePanel />
						<ol className="space-y-3 mt-4">
							{connectSteps.map(({ step, text }) => (
								<li key={step} className="flex gap-3 items-start">
									<span className="text-emerald-500 font-bold text-sm w-4 shrink-0">{step}</span>
									<span className="text-sm text-foreground/80 leading-relaxed">{text}</span>
								</li>
							))}
						</ol>
					</div>

					{/* Шаг 3: открыть в Telegram */}
					<TelegramBlock />
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
