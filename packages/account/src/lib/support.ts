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
import { useState } from 'react'
import { toast } from 'sonner'

import { openSupport } from '@/api/client.ts'
import { closeMiniApp, hapticError, openLink } from '@/lib/telegram.ts'

export function useSupportHandoff(): { busy: boolean; open: () => Promise<void> } {
	const [busy, setBusy] = useState(false)

	async function open() {
		setBusy(true)
		try {
			const { botLink } = await openSupport()
			openLink(botLink)
			// Закрываем кабинет следом: клиент уже в чате, и вернувшись «назад» он попал бы
			// на пустой экран поверх диалога.
			closeMiniApp()
		} catch (e) {
			hapticError()
			toast.error(e instanceof Error ? e.message : 'Не удалось открыть поддержку')
		} finally {
			setBusy(false)
		}
	}

	return { busy, open }
}
