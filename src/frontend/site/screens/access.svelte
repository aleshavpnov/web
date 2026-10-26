<script lang="ts">
	import { ArrowLeft, ArrowRight, Check, Clock, Copy, Send, Zap } from '@lucide/svelte'
	import QRCode from 'qrcode'

	import AddSubscriptionSteps from '#frontend/components/connect/add-subscription-steps.svelte'
	import { CLIENTS, detectPlatform, type ClientId } from '#frontend/components/connect/apps.ts'
	import ClientLink from '#frontend/components/connect/client-link.svelte'
	import ClientToggle from '#frontend/components/connect/client-toggle.svelte'
	import InstallSteps from '#frontend/components/connect/install-steps.svelte'
	import PlatformDialog from '#frontend/components/connect/platform-dialog.svelte'
	import Cta from '#frontend/components/cta.svelte'
	import Shell from '#frontend/components/shell.svelte'
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

	const STEPS: { id: 1 | 2 | 3; label: string }[] = [
		{ id: 1, label: 'Приложение' },
		{ id: 2, label: 'Ссылка-подписка' },
		{ id: 3, label: 'Telegram' },
	]

	const defaultPlatform = detectPlatform()
	// QR имеет смысл только там, где Telegram-аккаунт живёт на другом устройстве.
	const isDesktop = defaultPlatform === 'windows' || defaultPlatform === 'mac'

	restoreBridge()

	let client = $state<ClientId>('happ')
	let platform = $state(defaultPlatform)
	let dialogOpen = $state(false)
	let countdown = $state('')
	let qr = $state<string | null>(null)
	// Повторный визит с живой ссылкой открывается сразу на ней: приложение уже стоит.
	let step = $state<1 | 2 | 3>(bridge() ? 2 : 1)

	const cfg = $derived(CLIENTS[client])
	// Ссылка под текущий домен: на зеркале — backup-домен, иначе основной. Хост читаем здесь,
	// а не при сохранении, чтобы один сохранённый bridge резолвился по хосту визита.
	const subUrl = $derived($bridge ? pickSubscriptionUrl($bridge, location.hostname) : '')
	const deepLink = $derived($bridge?.deepLink ?? null)
	const botLink = $derived(
		deepLink ?? ($status?.botUsername ? `https://t.me/${$status.botUsername}` : BOT_FALLBACK_URL),
	)

	function isDone(id: number) {
		return id < step || (id === 2 && $bridge !== null)
	}

	function go(next: number) {
		step = Math.min(3, Math.max(1, next)) as 1 | 2 | 3
	}

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
	// шаг вернётся к кнопке, мёртвую ссылку не показываем.
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

<Shell page="access" wide>
	<div class="access">
		<header class="access__head">
			<div>
				<p class="access__eyebrow"><Clock size={14} />пробный доступ · 3&nbsp;часа</p>
				<h1 class="access__title">Получение доступа</h1>
			</div>
			<ClientToggle bind:value={client} />
		</header>

		<nav class="access__steps" aria-label="Шаги">
			{#each STEPS as s (s.id)}
				<button
					class={[
						'access__step',
						isDone(s.id) && 'access__step--done',
						step === s.id && 'access__step--current',
					]}
					type="button"
					aria-current={step === s.id ? 'step' : undefined}
					onclick={() => go(s.id)}
				>
					<span class="access__step-bar"></span>
					<span class="access__step-label">
						<span class="access__step-mark">
							{#if isDone(s.id) && step !== s.id}<Check size={14} strokeWidth={3} />{:else}{s.id}{/if}
						</span>
						{s.label}
					</span>
				</button>
			{/each}
		</nav>

		<section class="access__card">
			{#if step === 1}
				<div class="access__pane">
					<div class="access__pane-head">
						<h2 class="access__subtitle">Установите приложение</h2>
						<button class="link access__other" type="button" onclick={() => (dialogOpen = true)}>
							другое устройство?
						</button>
					</div>
					<p class="access__text">
						Установите и&nbsp;настройте <ClientLink client={cfg} /> — приложение, через&nbsp;которое работает
						ваше соединение.
					</p>
					<InstallSteps client={cfg} {platform} />
				</div>
			{:else if step === 2}
				<div class="access__pane access__pane--split">
					<div class="access__col">
						<h2 class="access__subtitle">Получите ссылку и&nbsp;добавьте её в&nbsp;{cfg.name}</h2>
						<p class="access__text">
							Временная ссылка работает 3&nbsp;часа и&nbsp;до&nbsp;5&nbsp;ГБ — хватит, чтобы зайти
							в&nbsp;бота и&nbsp;оформить пробный период.
						</p>
						{#if !$bridge}
							<Cta glow disabled={$bridgeBusy} onclick={() => void requestBridge()}>
								<Zap size={16} />
								{$bridgeBusy ? 'Получаем доступ…' : 'Получить временный доступ'}
							</Cta>
						{:else}
							<div class="access__sub">
								<div class="access__sub-head">
									<label class="access__sub-label" for="sub-url">ссылка-подписка</label>
									<span class="access__countdown"><Clock size={14} />{countdown}</span>
								</div>
								<div class="access__sub-row">
									<input id="sub-url" class="access__url" readonly value={subUrl} />
									<button class="access__copy" type="button" onclick={() => void copyUrl()}>
										<Copy size={16} /><span class="access__copy-text">Копировать</span>
									</button>
								</div>
							</div>
						{/if}
					</div>
					<div class="access__col access__col--aside">
						<p class="access__aside-title">В&nbsp;приложении</p>
						<AddSubscriptionSteps client={cfg} />
					</div>
				</div>
			{:else}
				<div class="access__pane">
					<h2 class="access__subtitle">Активируйте подписку в&nbsp;Telegram</h2>
					<p class="access__text">Перейдите в&nbsp;бота в&nbsp;Telegram и&nbsp;активируйте подписку.</p>
					<div class="access__tg"><Cta href={botLink}><Send size={16} />Открыть в Telegram</Cta></div>
					{#if qr}
						<div class="access__qr">
							<img class="access__qr-image" src={qr} alt="QR-код: открыть бота в Telegram" />
							<p class="access__text">
								Или отсканируйте с&nbsp;телефона — бот откроется сразу с&nbsp;привязкой вашего доступа.
							</p>
						</div>
					{/if}
				</div>
			{/if}
		</section>

		<div class="access__nav">
			{#if step > 1}
				<button class="access__back" type="button" onclick={() => go(step - 1)}>
					<ArrowLeft size={16} />{STEPS[step - 2]?.label}
				</button>
			{/if}
			{#if step < 3}
				<div class="access__next">
					<Cta onclick={() => go(step + 1)}
						><span>Дальше<span class="access__next-target">: {STEPS[step]?.label}</span></span><ArrowRight
							size={16}
						/></Cta
					>
				</div>
			{/if}
		</div>

		<p class="access__faq">
			Остались вопросы? Тарифы, пробный период и&nbsp;проблемы с&nbsp;подключением — <a class="link" href="/faq"
				>в&nbsp;FAQ</a
			>.
		</p>
	</div>
	<PlatformDialog open={dialogOpen} bind:value={platform} onclose={() => (dialogOpen = false)} />
</Shell>
<Toaster />

<style>
	.access {
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
		width: 100%;
		max-width: 55rem;
		margin-inline: auto;

		&__head {
			display: flex;
			flex-wrap: wrap;
			gap: 1rem;
			align-items: flex-end;
			justify-content: space-between;
		}

		&__eyebrow {
			display: inline-flex;
			gap: 0.5rem;
			align-items: center;
			margin-bottom: 0.5rem;
			font-size: 0.75rem;
			font-weight: 600;
			color: var(--accent);
			text-transform: uppercase;
			letter-spacing: 0.2em;
		}

		&__title {
			font-size: clamp(1.75rem, 4vw, 2.25rem);
			font-weight: 800;
			letter-spacing: -0.03em;
		}

		&__steps {
			display: grid;
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 0.75rem;
		}

		&__step {
			cursor: pointer;
			display: flex;
			flex-direction: column;
			gap: 0.625rem;
			padding: 0;
			border: 0;
			font: inherit;
			color: var(--muted);
			text-align: left;
			background: none;

			&--done,
			&--current {
				color: var(--fg);
			}

			&--current {
				font-weight: 700;
			}
		}

		&__step-bar {
			height: 4px;
			border-radius: 999px;
			background: var(--border);

			.access__step--done &,
			.access__step--current & {
				background: var(--accent-fill);
			}
		}

		&__step-label {
			display: flex;
			gap: 0.625rem;
			align-items: center;
			font-size: 0.875rem;

			@media (--below-sm) {
				font-size: 0.75rem;
			}
		}

		&__step-mark {
			display: flex;
			flex-shrink: 0;
			align-items: center;
			justify-content: center;
			box-sizing: border-box;
			width: 1.625rem;
			height: 1.625rem;
			border: 2px solid var(--border);
			border-radius: 50%;
			font-size: 0.8125rem;
			font-weight: 800;

			.access__step--done & {
				border-color: var(--accent-fill);
				color: var(--accent-fill-fg);
				background: var(--accent-fill);
			}

			.access__step--current & {
				border-color: var(--accent-fill);
				color: var(--accent);
				background: none;
			}
		}

		&__card {
			padding: 1.25rem;
			border: 1px solid var(--border);
			border-radius: 1.25rem;
			background: var(--card);
			box-shadow: 0 12px 32px -20px rgb(0 0 0 / 15%);

			@media (--md) {
				padding: 2.25rem;
			}
		}

		&__pane {
			display: flex;
			flex-direction: column;
			gap: 1rem;

			&--split {
				display: grid;
				grid-template-columns: minmax(0, 1fr);
				gap: 1.75rem;

				@media (--md) {
					grid-template-columns: repeat(2, minmax(0, 1fr));
					gap: 2.5rem;
				}
			}
		}

		&__pane-head {
			display: flex;
			flex-wrap: wrap;
			gap: 0.5rem 1rem;
			align-items: baseline;
			justify-content: space-between;
		}

		&__col {
			display: flex;
			flex-direction: column;
			gap: 1rem;
			min-width: 0;

			&--aside {
				@media (--md) {
					padding-left: 2.5rem;
					border-left: 1px solid var(--border);
				}
			}
		}

		&__subtitle {
			margin: 0;
			font-size: clamp(1.25rem, 3vw, 1.5rem);
			font-weight: 800;
			letter-spacing: -0.02em;
		}

		&__other {
			font-size: 0.8125rem;
		}

		&__text {
			font-size: 0.9375rem;
			line-height: 1.6;
			color: var(--muted);
		}

		&__aside-title {
			font-size: 0.8125rem;
			font-weight: 700;
			color: var(--muted);
			text-transform: uppercase;
			letter-spacing: 0.05em;
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
			font-weight: 700;
			font-variant-numeric: tabular-nums;
			color: light-dark(#b45309, #fbbf24);
		}

		&__sub-row {
			display: flex;
			gap: 0.5rem;
		}

		&__url {
			flex: 1;
			min-width: 0;
			height: 3rem;
			padding: 0 0.875rem;
			border: 1px solid var(--border);
			border-radius: 0.75rem;
			font-family: ui-monospace, sfmono-regular, menlo, monospace;
			font-size: 0.8125rem;
			color: color-mix(in srgb, var(--fg) 80%, transparent);
			text-overflow: ellipsis;
			background: var(--surface);
		}

		&__copy {
			cursor: pointer;
			display: inline-flex;
			flex-shrink: 0;
			gap: 0.5rem;
			align-items: center;
			justify-content: center;
			min-width: 3rem;
			height: 3rem;
			padding: 0 1.125rem;
			border: 0;
			border-radius: 0.75rem;
			font: inherit;
			font-size: 0.875rem;
			font-weight: 700;
			color: var(--accent-fill-fg);
			background: var(--accent-fill);
			transition: background-color 0.2s;

			&:hover {
				background: var(--accent-fill-hover);
			}
		}

		&__copy-text {
			@media (--below-sm) {
				display: none;
			}
		}

		&__tg {
			@media (--md) {
				align-self: flex-start;
			}
		}

		&__qr {
			display: flex;
			gap: 1rem;
			align-items: center;

			.access__text {
				margin: 0;
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

		&__nav {
			display: flex;
			gap: 1rem;
			align-items: center;
			justify-content: space-between;
		}

		&__back {
			cursor: pointer;
			display: inline-flex;
			gap: 0.5rem;
			align-items: center;
			min-height: 2.75rem;
			padding: 0 0.5rem;
			border: 0;
			font: inherit;
			font-size: 0.9375rem;
			font-weight: 600;
			color: var(--fg);
			background: none;
		}

		&__next {
			flex: 0 1 auto;
			margin-left: auto;

			@media (--below-sm) {
				flex: 1;
			}
		}

		/* На телефоне «Дальше: Ссылка-подписка» не влезает в строку, а шаг и так виден сверху. */
		&__next-target {
			@media (--below-sm) {
				display: none;
			}
		}

		&__faq {
			font-size: 0.875rem;
			color: var(--muted);
			text-align: center;
		}
	}
</style>
