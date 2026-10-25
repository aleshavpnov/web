<script lang="ts">
	import { toggleTheme, watchTheme, type Theme } from '@aimuzov/infra-site-kit/theme.js'
	import { Monitor, Moon, Sun } from '@lucide/svelte'

	import { THEME_KEY } from '#frontend/lib/theme.ts'

	let theme = $state<Theme>('auto')

	$effect(() => watchTheme((next) => (theme = next)))

	const LABEL: Record<Theme, string> = {
		auto: 'Тема как в системе, переключить',
		light: 'Светлая тема, переключить',
		dark: 'Тёмная тема, переключить',
	}
</script>

<button class="theme-button" type="button" aria-label={LABEL[theme]} onclick={() => toggleTheme({ key: THEME_KEY })}>
	{#if theme === 'light'}
		<Sun size={16} />
	{:else if theme === 'dark'}
		<Moon size={16} />
	{:else}
		<Monitor size={16} />
	{/if}
</button>

<style>
	.theme-button {
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		padding: 0;
		border: 0;
		color: var(--muted);
		background: none;
		transition: color 0.15s;

		&:hover {
			color: var(--fg);
		}
	}
</style>
