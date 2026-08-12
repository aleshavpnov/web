import { reatomComponent } from '@reatom/react'
import { useEffect, useState } from 'react'
import { Clock, Copy, Send, Zap } from 'lucide-react'
import QRCode from 'qrcode'
import { toast } from 'sonner'
import {
	AddSubscriptionSteps,
	CLIENTS,
	ClientLink,
	ClientToggle,
	detectPlatform,
	InstallSteps,
	PlatformDialog,
	stepBadgeClass,
	type ClientId,
} from '@shared/connect/index.ts'
import {
	bridgeAtom,
	bridgeBusyAtom,
	bridgeErrorAtom,
	expireBridge,
	pickSubscriptionUrl,
	requestBridge,
} from '@/state/bridge.ts'
import { statusAtom } from '@/state/status.ts'
import { navigate } from '@/state/screen.ts'
import { Layout } from '@/ui/components/Layout.tsx'
import { BackLink } from '@/ui/components/BackLink.tsx'
import { ctaClass } from '@/ui/cta.ts'

// CTA-кнопка копирования — по высоте инпута (items-stretch), только иконка.
const copyBtnClass =
	'inline-flex items-center justify-center shrink-0 px-3.5 bg-emerald-500 ' +
	'hover:bg-emerald-400 text-white rounded-lg transition-all duration-200 ' +
	'hover:shadow-lg hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0'

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

const defaultPlatform = detectPlatform()

// QR имеет смысл только там, где Telegram-аккаунт живёт на другом устройстве.
const isDesktop = defaultPlatform === 'windows' || defaultPlatform === 'mac'

// Крайний fallback для кнопки «Открыть в Telegram»: если username бота ещё не пришёл
// со статусом, кнопка всё равно ведёт в бота (не должна блокироваться).
const BOT_FALLBACK_URL = 'https://t.me/aleshavpnrobot'

const BridgePanel = reatomComponent(() => {
	const bridge = bridgeAtom()
	const busy = bridgeBusyAtom()
	const error = bridgeErrorAtom()
	const countdown = useCountdown(bridge?.expiresAt ?? null)

	useEffect(() => {
		if (error) toast.error(friendlyError(error))
	}, [error])

	// Ссылка под текущий домен: на зеркале — backup-домен, иначе основной. window.location
	// читаем здесь (а не в persist), чтобы один сохранённый bridge резолвился по хосту визита.
	const subUrl = bridge ? pickSubscriptionUrl(bridge, window.location.hostname) : ''

	const copyUrl = async () => {
		if (!subUrl) return
		await navigator.clipboard.writeText(subUrl)
		toast.success('Ссылка скопирована')
	}

	// Без раннего return: оба состояния живут в одной обёртке фиксированной
	// высоты, поэтому shortUrl вычисляем с guard на отсутствие bridge.
	const shortUrl = subUrl.length > 42 ? subUrl.slice(0, 42) + '…' : subUrl

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

// Шаг 3: открыть бота в Telegram. Если доступ уже получен на шаге 2 — ссылка с токеном
// привязки (bridge.deepLink) + QR на десктопе. Иначе кнопка ведёт просто в бота
// (t.me/<botUsername>) — человек мог получить доступ раньше и хочет сразу перейти.
const TelegramBlock = reatomComponent(() => {
	const bridge = bridgeAtom()
	const botUsername = statusAtom()?.botUsername
	const [qr, setQr] = useState<string | null>(null)
	const deepLink = bridge?.deepLink ?? null
	const botLink = deepLink ?? (botUsername ? `https://t.me/${botUsername}` : BOT_FALLBACK_URL)

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
			<a href={botLink} className={ctaClass}>
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
						Или отсканируйте с&nbsp;телефона — бот откроется сразу с&nbsp;привязкой вашего доступа.
					</p>
				</div>
			)}
		</div>
	)
})

export const Access = reatomComponent(() => {
	const [client, setClient] = useState<ClientId>('happ')
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
				<div className="mb-6">
					<ClientToggle value={client} onChange={setClient} />
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
						<InstallSteps client={cfg} platform={activeTab} />
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
						<div className="mt-4">
							<AddSubscriptionSteps client={cfg} />
						</div>
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
					<BackLink />
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
