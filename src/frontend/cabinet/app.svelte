<script lang="ts">
	import { ArrowLeft, House } from '@lucide/svelte'
	import type { Component } from 'svelte'

	import Toaster from '#frontend/components/toaster.svelte'

	import LoadingBar from './components/loading-bar.svelte'
	import Nav from './components/nav.svelte'
	import { colorScheme, initMiniApp, insideTelegram, onColorSchemeChange, setBackButton } from './lib/telegram.ts'
	import Home from './screens/home.svelte'
	import { navigate, SCREEN_PARENT, SCREEN_TITLE, screenAtom, startRouter, type ScreenName } from './state/screen.ts'
	import { canGoBack, stepAtom, wizardBack } from './state/wizard.ts'

	/** Тема на `<html>`: по `data-theme` токены `light-dark()` выбирают свою половину. */
	function applyTheme() {
		document.documentElement.dataset.theme = colorScheme()
	}

	// До первого рендера: иначе светлая вспышка в тёмном вебвью и пустой экран вместо
	// стартового, пришедшего из адреса.
	applyTheme()
	initMiniApp()
	startRouter(window)

	// Главная в основном чанке, остальные экраны догружаются при первом переходе: кабинет
	// открывают ради карточки подписки, и ждать код тарифов и графиков ей незачем.
	const SCREENS: Record<Exclude<ScreenName, 'home'>, () => Promise<{ default: Component }>> = {
		connect: () => import('./screens/connect.svelte'),
		plans: () => import('./screens/plans.svelte'),
		tariffs: () => import('./screens/tariffs.svelte'),
		buy: () => import('./screens/purchase/plan-purchase.svelte'),
		usage: () => import('./screens/usage.svelte'),
		refs: () => import('./screens/referrals.svelte'),
		more: () => import('./screens/more.svelte'),
	}

	// Куда ведёт «назад»: шаг подбора, если он есть; с подстраницы — к её родителю; иначе на
	// главную. На главной возвращаться некуда.
	const backTarget: 'step' | ScreenName | null = $derived(
		$screenAtom === 'plans' && canGoBack($stepAtom)
			? 'step'
			: $screenAtom === 'home'
				? null
				: (SCREEN_PARENT[$screenAtom] ?? 'home'),
	)

	function goBack() {
		if (backTarget === 'step') wizardBack()
		else if (backTarget) navigate(backTarget)
	}

	// Тему диктует Telegram (в браузере — системная): держим атрибут на <html> в синхроне.
	$effect(() => onColorSchemeChange(applyTheme))

	// Системная кнопка Telegram и стрелка в шапке ведут себя одинаково: сначала шаг назад
	// внутри подбора тарифа, и только когда возвращаться внутри экрана некуда — на главную.
	// Иначе кнопка «назад» на третьем шаге выбрасывала бы с экрана целиком. Шаг читается
	// в зависимостях, чтобы обработчик пересобирался вместе с ним.
	$effect(() => {
		const screen = $screenAtom

		void $stepAtom

		if (screen === 'home') return setBackButton(null)

		return setBackButton(() => {
			if (screen === 'plans' && wizardBack()) return

			navigate(SCREEN_PARENT[screen] ?? 'home')
		})
	})

	// Новый экран начинается сверху: документ тот же (меняется только хеш), и с длинной
	// страницы трафика переход уводил бы в середину следующей.
	$effect(() => {
		void $screenAtom
		window.scrollTo({ top: 0 })
	})
</script>

<div class="app">
	<LoadingBar />

	{#if !insideTelegram()}
		<p class="app__dev-note">
			Открыто вне Telegram: подписи initData нет. Работает только с дев-обходом на боте (
			<code class="app__code">CABINET_TMA_DEV_TGID</code>).
		</p>
	{/if}

	<!--
		Слева от заголовка всегда одно и то же место: стрелка «назад» там, где есть
		куда возвращаться, и иконка экрана на главной. Раньше на главной слот
		отсутствовал — заголовок съезжал влево и менял высоту шапки, отчего экран
		дёргался при каждом возврате.

		Стрелка дублирует системную кнопку Telegram: та есть не везде (десктоп,
		браузер) и уходит из поля зрения, когда листаешь экран.
	-->
	<header class="app__header">
		{#if backTarget}
			<button type="button" class="app__back" aria-label="Назад" onclick={goBack}>
				<ArrowLeft size={20} />
			</button>
		{:else}
			<span class="app__back app__back--static" aria-hidden="true"><House size={20} /></span>
		{/if}
		<h1 class="app__title">{SCREEN_TITLE[$screenAtom]}</h1>
	</header>

	<main class="app__main">
		{#key $screenAtom}
			{#if $screenAtom === 'home'}
				<Home />
			{:else}
				{#await SCREENS[$screenAtom]() then screen}
					<screen.default />
				{/await}
			{/if}
		{/key}
	</main>

	<Nav />
	<Toaster />
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		max-width: 42rem;
		min-height: 100dvh;
		margin-inline: auto;
		padding-inline: 1rem;

		&__dev-note {
			margin: 1rem 0 0.75rem;
			padding: 0.5rem 0.75rem;
			border-radius: var(--radius);
			font-size: 0.75rem;
			background: color-mix(in srgb, var(--viz-warning) 15%, transparent);
		}

		&__code {
			font-family: ui-monospace, sfmono-regular, menlo, monospace;
		}

		&__header {
			display: flex;
			gap: 0.25rem;
			align-items: center;
			padding: 1rem 0 0.25rem;
		}

		&__back {
			cursor: pointer;
			display: flex;
			flex-shrink: 0;
			align-items: center;
			justify-content: center;
			width: 2.75rem;
			height: 2.75rem;
			margin-left: -0.5rem;
			padding: 0;
			border: 0;
			border-radius: var(--radius);
			color: var(--brand);
			background: none;

			&:hover {
				background: var(--surface);
			}

			&--static {
				cursor: default;

				&:hover {
					background: none;
				}
			}
		}

		&__title {
			font-size: 1.125rem;
			font-weight: 700;
		}

		&__main {
			flex: 1;
			padding-top: 0.75rem;
		}
	}
</style>
