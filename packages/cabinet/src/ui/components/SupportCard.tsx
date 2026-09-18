/**
 * Вход в поддержку. Стоит на двух экранах — на главной (чтобы за помощью не надо было
 * искать раздел) и в «Ещё», — поэтому живёт отдельным компонентом, а не копией в каждом.
 *
 * Сама переписка остаётся в чате бота: там уже работают топики группы поддержки, вложения
 * и уведомления. Кабинет только включает режим и уводит в чат (см. useSupportHandoff).
 */
import { LifeBuoyIcon } from 'lucide-react'

import { Button } from '@/components/ui/button.tsx'
import { useSupportHandoff } from '@/lib/support.ts'
import { SECTION_CARD, SectionTitle } from './common.tsx'

export function SupportCard() {
	const { busy, open } = useSupportHandoff()

	return (
		<section className={SECTION_CARD}>
			<SectionTitle className="mb-1">Нужна помощь?</SectionTitle>
			<p className="mb-3 text-sm text-muted-foreground">
				Напишите нам в&nbsp;чат бота — ответим там же. Можно прикладывать скриншоты.
			</p>
			<Button variant="outline" className="w-full" disabled={busy} onClick={() => void open()}>
				<LifeBuoyIcon className="size-4" />
				{busy ? 'Открываем чат…' : 'Написать в поддержку'}
			</Button>
		</section>
	)
}
