<script lang="ts">
	/**
	 * Страница-мост `/app/add`: сюда кабинет отправляет диплинк с подпиской для своего
	 * Android-клиента. Telegram открывает https-ссылки в Custom Tabs мимо App Links, а
	 * автопереход по `intent://` Chrome блокирует — остаётся кнопка, по клику которой
	 * приложение получает подписку.
	 *
	 * Подписка лежит во фрагменте адреса и на сервер не уходит; отсюда её тоже никуда не
	 * отправляем — только собираем intent-ссылку для кнопки.
	 */
	import { SearchX, Smartphone } from '@lucide/svelte'

	import BackLink from '#frontend/components/back-link.svelte'
	import { APP_APK_URL, APP_RELEASES_URL } from '#frontend/components/connect/apps.ts'
	import { buildAppIntentUrl, decodeAppAddParam } from '#frontend/components/connect/deeplink.ts'
	import Cta from '#frontend/components/cta.svelte'
	import Eyebrow from '#frontend/components/eyebrow.svelte'
	import Shell from '#frontend/components/shell.svelte'

	// Читаем один раз: хеш нужен только для сборки ссылки, следить за ним незачем.
	const raw = new URLSearchParams(location.hash.replace(/^#/, '')).get('u')
	const u = raw && decodeAppAddParam(raw) ? raw : null
</script>

<Shell page="other">
	{#if !u}
		<div class="app-add app-add--empty">
			<SearchX class="app-add__icon" size={96} strokeWidth={1.5} />
			<div class="app-add__message">
				<h1 class="app-add__heading">Ссылка неполная</h1>
				<p class="app-add__text">
					Откройте её заново из&nbsp;кабинета в&nbsp;Telegram — кнопка «Открыть в&nbsp;приложении»
					на&nbsp;экране «Подключение».
				</p>
			</div>
			<BackLink />
		</div>
	{:else}
		<div class="app-add">
			<header class="app-add__head">
				<Eyebrow icon={Smartphone}>alesha vpnov</Eyebrow>
				<h1 class="app-add__title">Добавить подписку</h1>
			</header>
			<section class="app-add__card">
				<p class="app-add__text app-add__lead">
					Нажмите кнопку — приложение откроется и&nbsp;добавит подписку само. Останется нажать «Включить».
				</p>
				<Cta glow href={buildAppIntentUrl(u, APP_RELEASES_URL)}
					><Smartphone size={16} />Открыть в приложении</Cta
				>
				<p class="app-add__apk">Нет приложения? <a class="link" href={APP_APK_URL}>Скачать APK</a></p>
			</section>
			<div class="app-add__back"><BackLink /></div>
		</div>
	{/if}
</Shell>

<style>
	.app-add {
		&--empty {
			display: flex;
			flex: 1;
			flex-direction: column;
			gap: 1.5rem;
			align-items: center;
			justify-content: center;
			text-align: center;
		}

		:global(.app-add__icon) {
			color: var(--accent);
		}

		&__message {
			display: grid;
			gap: 0.5rem;
		}

		&__heading {
			font-size: 1.25rem;
			font-weight: 700;
		}

		&__head {
			margin-bottom: 1.5rem;
		}

		&__title {
			font-size: 1.5rem;
			font-weight: 700;
			letter-spacing: -0.025em;
		}

		&__card {
			padding: 1.25rem;
			border: 1px solid var(--border);
			border-radius: calc(var(--radius) * 1.4);
		}

		&__text {
			font-size: 0.875rem;
			line-height: 1.625;
			color: var(--muted);
		}

		&__lead {
			margin-bottom: 1rem;
		}

		&__apk {
			margin-top: 0.75rem;
			font-size: 0.75rem;
			color: var(--muted);
			text-align: center;
		}

		&__back {
			margin-top: 1.5rem;
		}
	}
</style>
