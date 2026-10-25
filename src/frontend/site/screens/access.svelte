<script lang="ts">
	import { Clock, Copy, Send, Zap } from '@lucide/svelte'
	import QRCode from 'qrcode'

	import BackLink from '#frontend/components/back-link.svelte'
	import AddSubscriptionSteps from '#frontend/components/connect/add-subscription-steps.svelte'
	import { CLIENTS, detectPlatform, type ClientId } from '#frontend/components/connect/apps.ts'
	import ClientLink from '#frontend/components/connect/client-link.svelte'
	import ClientToggle from '#frontend/components/connect/client-toggle.svelte'
	import InstallSteps from '#frontend/components/connect/install-steps.svelte'
	import PlatformDialog from '#frontend/components/connect/platform-dialog.svelte'
	import Cta from '#frontend/components/cta.svelte'
	import Eyebrow from '#frontend/components/eyebrow.svelte'
	import Shell from '#frontend/components/shell.svelte'
	import StepBadge from '#frontend/components/step-badge.svelte'
	import Toaster from '#frontend/components/toaster.svelte'
	import { toast } from '#frontend/lib/toast.ts'
	import {
		bridge,
		bridgeBusy,
		bridgeError,
		expireBridge,
		pickSubscriptionUrl,
		requestBridge,
		restoreBridge,
	} from '#frontend/site/state/bridge.ts'
	import { status } from '#frontend/site/state/status.ts'

	// Крайний fallback для кнопки «Открыть в Telegram»: если username бота ещё не пришёл
	// со статусом, кнопка всё равно ведёт в бота.
	const BOT_FALLBACK_URL = 'https://t.me/aleshavpnrobot'

	const defaultPlatform = detectPlatform()
	// QR имеет смысл только там, где Telegram-аккаунт живёт на другом устройстве.
	const isDesktop = defaultPlatform === 'windows' || defaultPlatform === 'mac'

	let client = $state<ClientId>('happ')
	let platform = $state(defaultPlatform)
	let dialogOpen = $state(false)
	let countdown = $state('')
	let qr = $state<string | null>(null)

	const cfg = $derived(CLIENTS[client])
	// Ссылка под текущий домен: на зеркале — backup-домен, иначе основной. Хост читаем здесь,
	// а не при сохранении, чтобы один сохранённый bridge резолвился по хосту визита.
	const subUrl = $derived($bridge ? pickSubscriptionUrl($bridge, location.hostname) : '')
	const shortUrl = $derived(subUrl.length > 42 ? `${subUrl.slice(0, 42)}…` : subUrl)
	const deepLink = $derived($bridge?.deepLink ?? null)
	const botLink = $derived(
		deepLink ?? ($status?.botUsername ? `https://t.me/${$status.botUsername}` : BOT_FALLBACK_URL),
	)

	restoreBridge()

	$effect(() => {
		const error = $bridgeError

		if (error)
			toast.error(
				error === 'rate-limit'
					? 'Слишком много запросов — попробуйте позже.'
					: 'Не удалось получить доступ. Попробуйте позже.',
			)
	})

	// Обратный отсчёт до конца временного доступа. Срок вышел — сбрасываем bridge целиком:
	// панель вернётся к кнопке, мёртвую ссылку не показываем.
	$effect(() => {
		const expiresAt = $bridge?.expiresAt

		if (!expiresAt) return

		const tick = () => {
			const diff = new Date(expiresAt).getTime() - Date.now()

			if (diff <= 0) {
				expireBridge()

				return
			}

			const h = Math.floor(diff / 3_600_000)
			const m = Math.floor((diff % 3_600_000) / 60_000)
			const s = Math.floor((diff % 60_000) / 1000)

			countdown = `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
		}

		tick()

		const id = setInterval(tick, 1000)

		return () => clearInterval(id)
	})

	$effect(() => {
		const link = deepLink

		qr = null

		if (!link || !isDesktop) return

		let alive = true

		// width 320 = 2x от отображаемых 160px, чтобы не мылился на ретине
		QRCode.toDataURL(link, { margin: 1, width: 320 })
			.then((url) => {
				if (alive) qr = url
			})
			.catch(() => {
				if (alive) qr = null
			})

		return () => {
			alive = false
		}
	})

	async function copyUrl() {
		if (!subUrl) return

		await navigator.clipboard.writeText(subUrl)
		toast.success('Ссылка скопирована')
	}
</script>

<Shell page="access">
	<div class="access">
		<header class="access__head">
			<Eyebrow icon={Clock}>пробный доступ · 3&nbsp;часа</Eyebrow>
			<h1 class="access__title">Получение доступа</h1>
		</header>

		<div class="access__toggle"><ClientToggle bind:value={client} /></div>

		<div class="access__steps">
			<section class="access__card">
				<div class="access__card-head">
					<StepBadge>Шаг 1</StepBadge>
					<button class="link access__other" type="button" onclick={() => (dialogOpen = true)}>
						другое устройство?
					</button>
				</div>
				<p class="access__text">
					Установите и&nbsp;настройте <ClientLink client={cfg} /> — приложение, через&nbsp;которое работает ваше
					соединение.
				</p>
				<InstallSteps client={cfg} {platform} />
			</section>

			<section class="access__card">
				<div class="access__card-head"><StepBadge>Шаг 2</StepBadge></div>
				<p class="access__text">
					Получите временную ссылку-подписку<br />и&nbsp;добавьте её в&nbsp;{cfg.name}.
				</p>
				<!-- Высота держит место панели со ссылкой, чтобы инструкция ниже не прыгала
				     при смене кнопки на панель. -->
				<div class="access__bridge">
					{#if !$bridge}
						<Cta glow disabled={$bridgeBusy} onclick={() => void requestBridge()}>
							<Zap size={16} />
							{$bridgeBusy ? 'Получаем доступ…' : 'Получить временный доступ'}
						</Cta>
					{:else}
						<div class="access__sub">
							<div class="access__sub-head">
								<p class="access__sub-label">ссылка-подписка</p>
								<p class="access__countdown">
									<Clock class="access__clock" size={14} /><span>{countdown}</span>
								</p>
							</div>
							<div class="access__sub-row">
								<div class="access__url">{shortUrl}</div>
								<button
									class="access__copy"
									type="button"
									aria-label="Копировать ссылку"
									onclick={() => void copyUrl()}
								>
									<Copy size={16} />
								</button>
							</div>
						</div>
					{/if}
				</div>
				<div class="access__add"><AddSubscriptionSteps client={cfg} /></div>
			</section>

			<!-- Шаг 3: если доступ уже получен на шаге 2 — ссылка с токеном привязки и QR на десктопе.
			     Иначе кнопка ведёт просто в бота: человек мог получить доступ раньше. -->
			<section class="access__card">
				<div class="access__card-head"><StepBadge>Шаг 3</StepBadge></div>
				<p class="access__text">Перейдите в&nbsp;бота в&nbsp;Telegram и&nbsp;активируйте подписку.</p>
				<Cta href={botLink}><Send size={16} />Открыть в Telegram</Cta>
				{#if qr}
					<div class="access__qr">
						<img class="access__qr-image" src={qr} alt="QR-код: открыть бота в Telegram" />
						<p class="access__text">
							Или отсканируйте с&nbsp;телефона — бот откроется сразу с&nbsp;привязкой вашего доступа.
						</p>
					</div>
				{/if}
			</section>
		</div>

		<section class="access__card access__faq">
			<p class="access__faq-title">Есть вопросы?</p>
			<p class="access__text">
				В&nbsp;FAQ собраны ответы про тариф и&nbsp;оплату, пробный период, поддерживаемые устройства
				и&nbsp;типичные проблемы с&nbsp;подключением.
			</p>
			<Cta href="/faq">Открыть FAQ</Cta>
		</section>

		<div class="access__back"><BackLink /></div>
	</div>
	<PlatformDialog open={dialogOpen} bind:value={platform} onclose={() => (dialogOpen = false)} />
</Shell>
<Toaster />

<style>
	.access {
		&__head {
			margin-bottom: 1.5rem;
		}

		&__title {
			font-size: 1.5rem;
			font-weight: 700;
			letter-spacing: -0.025em;
		}

		&__toggle {
			margin-bottom: 1.5rem;
		}

		&__steps {
			display: flex;
			flex-direction: column;
			gap: 1rem;
		}

		&__card {
			padding: 1.25rem;
			border: 1px solid var(--border);
			border-radius: calc(var(--radius) * 1.4);
		}

		&__card-head {
			display: flex;
			gap: 0.75rem;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 0.5rem;
		}

		&__other {
			font-size: 0.75rem;
		}

		&__text {
			margin-bottom: 1rem;
			font-size: 0.875rem;
			line-height: 1.625;
			color: var(--muted);
		}

		&__bridge {
			display: flex;
			flex-direction: column;
			justify-content: center;
			min-height: 4.375rem;
		}

		&__sub {
			display: grid;
			grid-template-columns: minmax(0, 1fr);
			gap: 0.5rem;
		}

		&__sub-head {
			display: flex;
			gap: 0.5rem;
			align-items: center;
			justify-content: space-between;
		}

		&__sub-label {
			font-size: 0.75rem;
			color: var(--muted);
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}

		&__countdown {
			display: inline-flex;
			gap: 0.375rem;
			align-items: center;
			font-size: 0.875rem;
			font-weight: 500;
			font-variant-numeric: tabular-nums;
		}

		:global(.access__clock) {
			flex-shrink: 0;
			color: #f59e0b;
		}

		&__sub-row {
			display: flex;
			gap: 0.5rem;
			align-items: stretch;
		}

		&__url {
			overflow: hidden;
			flex: 1;
			min-width: 0;
			padding: 0.625rem 0.75rem;
			border: 1px solid var(--border);
			border-radius: var(--radius);
			font-family: ui-monospace, sfmono-regular, menlo, monospace;
			font-size: 0.875rem;
			color: color-mix(in srgb, var(--fg) 80%, transparent);
			text-overflow: ellipsis;
			white-space: nowrap;
			background: var(--surface);
		}

		&__copy {
			cursor: pointer;
			display: inline-flex;
			flex-shrink: 0;
			align-items: center;
			justify-content: center;
			padding-inline: 0.875rem;
			border: 0;
			border-radius: var(--radius);
			color: var(--cta-fg);
			background: var(--cta-bg);
			transition: background-color 0.2s;

			&:hover {
				background: var(--cta-bg-hover);
			}
		}

		&__add {
			margin-top: 1rem;
		}

		&__qr {
			display: flex;
			gap: 1rem;
			align-items: center;
			margin-top: 1rem;

			.access__text {
				margin-bottom: 0;
			}
		}

		&__qr-image {
			flex-shrink: 0;
			width: 10rem;
			height: 10rem;
			padding: 0.5rem;
			border-radius: var(--radius);
			background: #fff;
		}

		&__faq {
			margin-top: 2rem;
		}

		&__faq-title {
			margin-bottom: 0.25rem;
			font-size: 0.875rem;
			font-weight: 600;
		}

		&__back {
			margin-top: 1.5rem;
		}
	}
</style>
