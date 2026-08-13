/**
 * Вход в поддержку. Стоит на двух экранах — на главной (чтобы за помощью не надо было
 * искать раздел) и в «Ещё», — поэтому живёт отдельным компонентом, а не копией в каждом.
 *
 * Сама переписка остаётся в чате бота: там уже работают топики группы поддержки, вложения
 * и уведомления. Кабинет только включает режим и уводит в чат.
 */
import { useState } from 'react'
import { LifeBuoyIcon } from 'lucide-react'
import { toast } from 'sonner'

import { openSupport } from '@/api/client.ts'
import { Button } from '@/components/ui/button.tsx'
import { closeMiniApp, hapticError, openLink } from '@/lib/telegram.ts'
import { SECTION_CARD, SectionTitle } from './common.tsx'

export function SupportCard() {
	const [busy, setBusy] = useState(false)

	async function write() {
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

	return (
		<section className={SECTION_CARD}>
			<SectionTitle className="mb-1">Нужна помощь?</SectionTitle>
			<p className="mb-3 text-sm text-muted-foreground">
				Напишите нам в&nbsp;чат бота — ответим там же. Можно прикладывать скриншоты.
			</p>
			<Button variant="outline" className="w-full" disabled={busy} onClick={() => void write()}>
				<LifeBuoyIcon className="size-4" />
				{busy ? 'Открываем чат…' : 'Написать в поддержку'}
			</Button>
		</section>
	)
}
