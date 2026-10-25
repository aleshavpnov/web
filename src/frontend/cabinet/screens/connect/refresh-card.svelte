<script lang="ts">
	/**
	 * Карточка «Обновить подписку» — цель диплинка `#/connect/refresh` из подсказки бота про
	 * устаревший профиль. По приходу оттуда карточка подсвечивается и подтягивается к верху
	 * экрана: без этого человек попадал на начало «Подключения» и видел инструкцию по
	 * установке, хотя приложение у него давно стоит.
	 *
	 * Скролл отложен через requestAnimationFrame: на момент эффекта ссылка ещё грузится,
	 * высота карточек меняется, и без кадра ожидания промахивались мимо секции.
	 */
	import { RefreshCw } from '@lucide/svelte'

	import Card from '#frontend/cabinet/components/card.svelte'
	import SectionTitle from '#frontend/cabinet/components/section-title.svelte'
	import type { ClientConfig } from '#frontend/components/connect/apps.ts'
	import RefreshSubscriptionSteps from '#frontend/components/connect/refresh-subscription-steps.svelte'

	let { client, focus }: { client: ClientConfig; focus: boolean } = $props()

	let node = $state<HTMLElement>()

	$effect(() => {
		if (!focus || !node) return

		const target = node
		const id = requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }))

		return () => cancelAnimationFrame(id)
	})
</script>

<Card bind:node glow={focus}>
	<SectionTitle gap="xs"><RefreshCw class="refresh-card__icon" size={16} />Обновить подписку</SectionTitle>
	<p class="refresh-card__text">
		Нужно, когда российские сайты пошли через наши серверы: свежий профиль уводит их напрямую. Приложение
		переустанавливать не&nbsp;надо, ссылка остаётся прежней.
	</p>
	<RefreshSubscriptionSteps {client} />
</Card>

<style>
	:global(.refresh-card__icon) {
		color: var(--brand);
	}

	.refresh-card__text {
		margin-bottom: 0.75rem;
		font-size: 0.875rem;
		color: var(--muted);
	}
</style>
