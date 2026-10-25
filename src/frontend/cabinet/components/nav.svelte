<script lang="ts">
	import { Activity, CreditCard, Ellipsis, House, PlugZap, Users } from '@lucide/svelte'

	import { navigate, rootScreen, screenAtom, type ScreenName } from '#frontend/cabinet/state/screen.ts'

	/**
	 * Нижняя навигация — под большой палец: кабинет открывают с телефона.
	 * Всё редкое (настройки, «что нового», поддержка) живёт в «Ещё».
	 */
	const TABS = [
		{ name: 'home', label: 'Главная', icon: House },
		// «Доступ», а не «Подключение»: шесть вкладок на 375px, и длинная подпись слипается
		// с соседней. Заголовок экрана при этом остаётся полным.
		{ name: 'connect', label: 'Доступ', icon: PlugZap },
		{ name: 'plans', label: 'Тарифы', icon: CreditCard },
		{ name: 'usage', label: 'Трафик', icon: Activity },
		{ name: 'refs', label: 'Друзья', icon: Users },
		{ name: 'more', label: 'Ещё', icon: Ellipsis },
	] as const satisfies ReadonlyArray<{ name: ScreenName; label: string; icon: unknown }>

	// Подстраница подсвечивает вкладку предка: у витрины и оформления своей вкладки
	// нет, и без этого нижнее меню выглядело бы так, будто мы вообще вне кабинета.
	const current = $derived(rootScreen($screenAtom))
</script>

<nav class="nav">
	{#each TABS as tab (tab.name)}
		{@const Icon = tab.icon}
		<!-- Вкладка целиком тач-цель, а не одна иконка: промах по соседней вкладке уводит
		     на другой экран, и это самая частая ошибка пальцем. -->
		<button
			type="button"
			class={['nav__tab', current === tab.name && 'nav__tab--active']}
			aria-current={current === tab.name ? 'page' : undefined}
			onclick={() => navigate(tab.name)}
		>
			<Icon size={24} />
			{tab.label}
		</button>
	{/each}
</nav>

<style>
	.nav {
		position: sticky;
		z-index: 10;
		bottom: 0;
		display: flex;
		margin: 1.5rem -1rem 0;
		padding: 0.375rem 0.25rem max(0.5rem, env(safe-area-inset-bottom));
		border-top: 1px solid var(--border);
		background: color-mix(in srgb, var(--bg) 95%, transparent);
		backdrop-filter: blur(8px);

		&__tab {
			cursor: pointer;
			display: flex;
			flex: 1;
			flex-direction: column;
			gap: 0.25rem;
			align-items: center;
			justify-content: center;
			min-width: 0;
			min-height: 3.5rem;
			padding: 0.375rem 0;
			border: 0;
			border-radius: var(--radius);
			font: inherit;
			font-size: 11px;
			line-height: 1;
			color: var(--muted);
			background: none;

			&:hover {
				color: var(--fg);
			}

			&--active,
			&--active:hover {
				color: var(--brand);
			}
		}
	}
</style>
