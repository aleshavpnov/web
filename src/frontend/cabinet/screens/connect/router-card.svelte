<script lang="ts">
	/**
	 * Персональный конфиг для роутера — доступен на тарифах от 10 устройств.
	 *
	 * Файл приходит документом в чат бота, а не в загрузки: вебвью Mini App не отдаёт
	 * blob-ссылку загрузчику ни на одном клиенте, и кнопка «скачать» молча не делала ничего.
	 * Дальше — как у поддержки: открываем чат и закрываемся, чтобы не оставлять кабинет
	 * поверх диалога, в котором лежит файл.
	 */
	import { Router } from '@lucide/svelte'

	import { sendKeeneticConf } from '#frontend/cabinet/api/client.ts'
	import Button from '#frontend/cabinet/components/button.svelte'
	import Card from '#frontend/cabinet/components/card.svelte'
	import SectionTitle from '#frontend/cabinet/components/section-title.svelte'
	import { closeMiniApp, hapticError, openLink } from '#frontend/cabinet/lib/telegram.ts'
	import { toast } from '#frontend/lib/toast.ts'

	let busy = $state(false)

	async function send() {
		busy = true

		try {
			const { botLink } = await sendKeeneticConf()

			openLink(botLink)
			closeMiniApp()
		} catch (e) {
			hapticError()
			toast.error(e instanceof Error ? e.message : 'Не удалось получить конфиг')
		} finally {
			busy = false
		}
	}
</script>

<Card>
	<SectionTitle gap="xs">Роутер Keenetic</SectionTitle>
	<p class="router-card__text">
		Раздаёт доступ на&nbsp;всю домашнюю сеть — приложение на&nbsp;устройствах не&nbsp;нужно. Файл настроек
		и&nbsp;шаги импорта пришлём в&nbsp;чат бота.
	</p>
	<Button wide disabled={busy} onclick={send}>
		<Router size={16} />
		{busy ? 'Отправляем…' : 'Прислать конфиг в чат'}
	</Button>
</Card>

<style>
	.router-card__text {
		margin-bottom: 0.75rem;
		font-size: 0.875rem;
		color: var(--muted);
	}
</style>
