<script lang="ts">
	import { Check, Clock, Copy, Send, Zap } from '@lucide/svelte'
	import QRCode from 'qrcode'

	import AddSubscriptionSteps from '#frontend/components/connect/add-subscription-steps.svelte'
	import { CLIENTS, detectPlatform, type ClientId } from '#frontend/components/connect/apps.ts'
	import ClientLink from '#frontend/components/connect/client-link.svelte'
	import ClientToggle from '#frontend/components/connect/client-toggle.svelte'
	import InstallSteps from '#frontend/components/connect/install-steps.svelte'
	import PlatformDialog from '#frontend/components/connect/platform-dialog.svelte'
	import Cta from '#frontend/components/cta.svelte'
	import Eyebrow from '#frontend/components/eyebrow.svelte'
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

	const defaultPlatform = detectPlatform()
	// QR имеет смысл только там, где Telegram-аккаунт живёт на другом устройстве.
	const isDesktop = defaultPlatform === 'windows' || defaultPlatform === 'mac'

	restoreBridge()

	let client = $state<ClientId>('happ')
	let platform = $state(defaultPlatform)
	let dialogOpen = $state(false)
	let countdown = $state('')
	let qr = $state<string | null>(null)

	const cfg = $derived(CLIENTS[client])
	// Ссылка под текущий домен: на зеркале — backup-домен, иначе основной. Хост читаем здесь,
	// а не при сохранении, чтобы один сохранённый bridge резолвился по хосту визита.
	const subUrl = $derived($bridge ? pickSubscriptionUrl($bridge, location.hostname) : '')
	const deepLink = $derived($bridge?.deepLink ?? null)
	const botLink = $derived(
		deepLink ?? ($status?.botUsername ? `https://t.me/${$status.botUsername}` : BOT_FALLBACK_URL),
	)
	// Поставил ли человек приложение, сайт не знает. Ссылка получена — значит, первые два шага
	// пройдены и дальше Telegram; до этого текущим считается начало.
	const current = $derived($bridge ? 3 : 1)

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

<!-- Панель доступа: на десктопе в колонке справа, на телефоне внутри шага 2. -->
{#snippet panel(id: string)}
	{#if !$bridge}
		<Cta glow disabled={$bridgeBusy} onclick={() => void requestBridge()}>
			<Zap size={16} />
			{$bridgeBusy ? 'Получаем доступ…' : 'Получить временный доступ'}
		</Cta>
	{:else}
		<div class="access__sub">
			<div class="access__sub-head">
				<label class="access__sub-label" for={id}>ссылка-подписка</label>
				<span class="access__countdown"><Clock size={14} />{countdown}</span>
			</div>
			<div class="access__sub-row">
				<input {id} class="access__url" readonly value={subUrl} />
				<button
					class="access__copy"
					type="button"
					aria-label="Копировать ссылку"
					onclick={() => void copyUrl()}
				>
					<Copy size={17} />
				</button>
			</div>
		</div>
	{/if}
{/snippet}

{#snippet marker(n: number)}
	{@const done = $bridge !== null && n < 3}
	<span
		class={['access__mark', done && 'access__mark--done', !done && current === n && 'access__mark--current']}
		aria-label={done ? `Шаг ${n} пройден` : `Шаг ${n}`}
	>
		{#if done}<Check size={18} strokeWidth={2.5} />{:else}{n}{/if}
	</span>
{/snippet}

<Shell page="access" wide>
	<div class="access">
		<div class="access__main">
			<header class="access__head">
				<Eyebrow icon={Clock}>пробный доступ · 3&nbsp;часа</Eyebrow>
				<h1 class="access__title">Получение доступа</h1>
			</header>

			<div class="access__toggle"><ClientToggle bind:value={client} /></div>

			<ol class="access__steps">
				<li class="access__step">
					<div class="access__rail">{@render marker(1)}<span class="access__line"></span></div>
					<div class="access__body">
						<div class="access__body-head">
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
				</li>

				<li class="access__step">
					<div class="access__rail">{@render marker(2)}<span class="access__line"></span></div>
					<div class="access__body">
						<h2 class="access__subtitle">Добавьте ссылку-подписку в&nbsp;{cfg.name}</h2>
						<p class="access__text">
							Временная ссылка работает 3&nbsp;часа и&nbsp;до&nbsp;5&nbsp;ГБ — хватит, чтобы зайти
							в&nbsp;бота.
						</p>
						<div class="access__inline-panel">{@render panel('sub-url-inline')}</div>
						<AddSubscriptionSteps client={cfg} />
					</div>
				</li>

				<li class="access__step">
					<div class="access__rail">{@render marker(3)}</div>
					<div class="access__body">
						<h2 class="access__subtitle">Активируйте подписку в&nbsp;Telegram</h2>
						<p class="access__text">Перейдите в&nbsp;бота в&nbsp;Telegram и&nbsp;активируйте подписку.</p>
						<div class="access__tg"><Cta href={botLink}><Send size={16} />Открыть в Telegram</Cta></div>
					</div>
				</li>
			</ol>
		</div>

		<aside class="access__aside" aria-label="Ваш доступ">
			<section class="access__card">
				<p class="access__card-title">Ваш доступ</p>
				{@render panel('sub-url')}
				{#if qr}
					<div class="access__qr">
						<img class="access__qr-image" src={qr} alt="QR-код: открыть бота в Telegram" />
						<p class="access__text">
							Telegram на&nbsp;телефоне? Отсканируйте — бот откроется сразу с&nbsp;привязкой этого
							доступа.
						</p>
					</div>
				{/if}
			</section>
			<section class="access__card access__card--muted">
				<p class="access__card-title">Есть вопросы?</p>
				<p class="access__text">
					Тарифы, пробный период, устройства и&nbsp;типичные проблемы — <a class="link" href="/faq"
						>в&nbsp;FAQ</a
					>.
				</p>
			</section>
		</aside>
	</div>
	<PlatformDialog open={dialogOpen} bind:value={platform} onclose={() => (dialogOpen = false)} />
</Shell>
<Toaster />

<style>
	.access {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 2rem;

		@media (--md) {
			grid-template-columns: minmax(0, 1fr) 22rem;
			gap: 3.5rem;
			align-items: start;
		}

		&__main {
			min-width: 0;
		}

		&__title {
			font-size: clamp(1.75rem, 4vw, 2.5rem);
			font-weight: 800;
			letter-spacing: -0.03em;
		}

		&__toggle {
			margin-block: 1.5rem 2rem;
		}

		&__steps {
			margin: 0;
			padding: 0;
			list-style: none;
		}

		&__step {
			display: grid;
			grid-template-columns: 2.25rem minmax(0, 1fr);
			column-gap: 1rem;

			@media (--md) {
				grid-template-columns: 2.5rem minmax(0, 1fr);
				column-gap: 1.25rem;
			}
		}

		&__rail {
			display: flex;
			flex-direction: column;
			align-items: center;
		}

		&__mark {
			display: flex;
			flex-shrink: 0;
			align-items: center;
			justify-content: center;
			box-sizing: border-box;
			width: 2.25rem;
			height: 2.25rem;
			border: 2px solid var(--border);
			border-radius: 50%;
			font-size: 0.9375rem;
			font-weight: 800;
			color: var(--muted);
			background: var(--bg);

			&--done {
				border-color: var(--accent-fill);
				color: var(--accent-fill-fg);
				background: var(--accent-fill);
			}

			&--current {
				border-color: var(--accent-fill);
				color: var(--accent);
				box-shadow: 0 0 0 5px color-mix(in srgb, var(--accent-fill) 18%, transparent);
			}
		}

		&__line {
			flex: 1;
			width: 2px;
			margin-block: 0.375rem;
			background: var(--border);

			.access__mark--done + & {
				background: var(--accent-fill);
			}
		}

		&__body {
			display: flex;
			flex-direction: column;
			gap: 0.875rem;
			min-width: 0;
			padding-bottom: 2.25rem;

			.access__step:last-child & {
				padding-bottom: 0;
			}
		}

		&__body-head {
			display: flex;
			flex-wrap: wrap;
			gap: 0.25rem 1rem;
			align-items: baseline;
			justify-content: space-between;
		}

		&__subtitle {
			margin: 0.375rem 0 0;
			font-size: 1.1875rem;
			font-weight: 700;
		}

		&__other {
			font-size: 0.8125rem;
		}

		&__text {
			font-size: 0.9375rem;
			line-height: 1.6;
			color: var(--muted);
		}

		&__inline-panel {
			@media (--md) {
				display: none;
			}
		}

		&__tg {
			@media (--sm) {
				align-self: flex-start;
			}
		}

		&__aside {
			display: none;

			@media (--md) {
				position: sticky;
				top: 1.5rem;
				display: grid;
				gap: 1rem;
			}
		}

		&__card {
			display: grid;
			gap: 1rem;
			padding: 1.375rem;
			border: 1px solid var(--border);
			border-radius: 1.125rem;
			background: var(--card);
			box-shadow: 0 12px 32px -16px rgb(0 0 0 / 12%);

			&--muted {
				gap: 0.25rem;
				background: none;
				box-shadow: none;
			}
		}

		&__card-title {
			font-size: 0.9375rem;
			font-weight: 700;
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
			height: 2.75rem;
			padding: 0 0.75rem;
			border: 1px solid var(--border);
			border-radius: 0.625rem;
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
			align-items: center;
			justify-content: center;
			width: 2.75rem;
			height: 2.75rem;
			border: 0;
			border-radius: 0.625rem;
			color: var(--accent-fill-fg);
			background: var(--accent-fill);
			transition: background-color 0.2s;

			&:hover {
				background: var(--accent-fill-hover);
			}
		}

		&__qr {
			display: flex;
			gap: 1rem;
			align-items: center;
			padding-top: 1rem;
			border-top: 1px solid var(--border);

			.access__text {
				font-size: 0.875rem;
			}
		}

		&__qr-image {
			flex-shrink: 0;
			width: 8.25rem;
			height: 8.25rem;
			padding: 0.375rem;
			border-radius: var(--radius);
			background: #fff;
		}
	}
</style>
