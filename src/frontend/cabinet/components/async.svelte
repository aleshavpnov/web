<script lang="ts" generics="T">
	import { TriangleAlert } from '@lucide/svelte'
	import type { Snippet } from 'svelte'

	import Skeleton from '@aimuzov/infra-site-kit/ui/skeleton.svelte'

	/**
	 * Обёртка «загрузка / ошибка / данные». Ошибку показываем текстом от сервера: он
	 * человеческий (см. fail() в cabinet-api.ts), и клиенту он полезнее, чем «что-то пошло не так».
	 *
	 * Скелетон — только когда показывать нечего. Прошлый ответ во время рефетча остаётся
	 * на экране в полную силу: гасить готовое не за что, а что идёт обновление,
	 * говорит полоска сверху (LoadingBar).
	 */
	let {
		data,
		loading,
		error,
		skeleton,
		stack = false,
		children,
	}: {
		data: T | null
		loading: boolean
		error: string | null
		skeleton?: Snippet
		/** Данные стопкой с ритмом экрана: вертикальный ритм обязан жить здесь, а не снаружи. */
		stack?: boolean
		children: Snippet<[T]>
	} = $props()
</script>

{#if error}
	<div class="async__error"><TriangleAlert class="async__error-icon" size={16} /><span>{error}</span></div>
{:else if data === null}
	{#if loading}
		{#if skeleton}{@render skeleton()}{:else}<Skeleton height="6rem" />{/if}
	{:else}
		<div class="async__empty">Нет данных</div>
	{/if}
{:else}
	<div class={['async', stack && 'async--stack']}>{@render children(data)}</div>
{/if}

<style>
	.async {
		&--stack {
			display: flex;
			flex-direction: column;
			gap: 1rem;
		}

		&__error {
			display: flex;
			gap: 0.5rem;
			align-items: flex-start;
			padding: 0.75rem;
			border-radius: var(--radius);
			font-size: 0.875rem;
			color: var(--danger);
			background: color-mix(in srgb, var(--danger) 10%, transparent);

			:global(.async__error-icon) {
				flex-shrink: 0;
				margin-top: 0.125rem;
			}
		}

		&__empty {
			padding-block: 1.5rem;
			font-size: 0.875rem;
			color: var(--muted);
		}
	}
</style>
