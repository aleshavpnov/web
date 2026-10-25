/**
 * Переход из кабинета в чат поддержки.
 *
 * Сама переписка живёт в чате бота: там уже работают топики группы поддержки, вложения и
 * уведомления. Кабинет только включает режим переписки, открывает чат и закрывается —
 * текст человек пишет сам. Ничего не предзаполняем: поддержке нужен рассказ своими
 * словами, а подставленная заготовка ровно его и вытесняет.
 *
 * Живёт отдельно от карточек, которые этим ходом пользуются: их уже две (общая «Нужна
 * помощь?» и просьба про устройства), и повторять обработку ошибок в каждой незачем.
 */
import { openSupport } from '#frontend/cabinet/api/client.ts'
import { toast } from '#frontend/lib/toast.ts'

import { closeMiniApp, hapticError, openLink } from './telegram.ts'

export async function openSupportChat(): Promise<void> {
	try {
		const { botLink } = await openSupport()

		openLink(botLink)
		// Закрываем кабинет следом: клиент уже в чате, и вернувшись «назад» он попал бы
		// на пустой экран поверх диалога.
		closeMiniApp()
	} catch (e) {
		hapticError()
		toast.error(e instanceof Error ? e.message : 'Не удалось открыть поддержку')
	}
}
