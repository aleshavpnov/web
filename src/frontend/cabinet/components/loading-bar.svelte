<script lang="ts">
	import { anyLoading } from '#frontend/cabinet/state/resource.ts'

	/**
	 * Полоска фонового обновления во всю ширину экрана.
	 *
	 * Единственная на приложение: экран во время рефетча остаётся живым и кликабельным
	 * (см. Async), и сказать «сейчас обновится» нужно один раз сверху, а не гасить
	 * каждый блок по отдельности.
	 */

	/**
	 * Сколько ждать, прежде чем показать полоску. Ответы /api/me обычно быстрее, а переход
	 * между вкладками перезапрашивает экран каждый раз — без задержки полоска моргала бы
	 * на ровном месте.
	 */
	const APPEAR_DELAY_MS = 200

	let visible = $state(false)

	$effect(() => {
		if (!$anyLoading) {
			visible = false

			return
		}

		const timer = setTimeout(() => (visible = true), APPEAR_DELAY_MS)

		return () => clearTimeout(timer)
	})
</script>

{#if visible}
	<div class="loading-bar" aria-hidden="true"><span class="loading-bar__runner"></span></div>
{/if}

<style>
	.loading-bar {
		pointer-events: none;
		position: fixed;
		z-index: 50;
		inset: 0 0 auto;
		overflow: hidden;
		height: 2px;

		/* Бегунок ходит от края до края, пока идёт запрос. */
		&__runner {
			display: block;
			width: 33%;
			height: 100%;
			background: var(--brand-fill);
			animation: slide 1.1s ease-in-out infinite;

			/* Без движения бегунок замер бы обрубком у левого края — растягиваем во всю ширину. */
			@media (--reduced-motion) {
				width: 100%;
				animation: none;
			}
		}
	}

	@keyframes slide {
		from {
			transform: translateX(-100%);
		}

		to {
			transform: translateX(400%);
		}
	}
</style>
