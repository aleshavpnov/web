/**
 * Просьба поднять лимит устройств. Показывается на «Трафике» под списком устройств всем, у
 * кого лимит вообще есть, — почему не только упёршимся, объяснено в Usage.tsx.
 *
 * Тарифом такой случай не всегда решается: у самого вместительного лимит тоже конечен, а
 * поводы бывают разные. Поэтому кнопка ведёт не в витрину, а в чат: человек пишет сам,
 * своими словами, и лимит поднимают руками из админки.
 */
import { MessageSquarePlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button.tsx'
import { useSupportHandoff } from '@/lib/support.ts'
import { SECTION_CARD, SectionTitle } from './common.tsx'

export function MoreDevicesCard() {
	const { busy, open } = useSupportHandoff()

	return (
		<section className={SECTION_CARD}>
			<SectionTitle className="mb-1">Не хватает устройств?</SectionTitle>
			<p className="mb-3 text-sm text-muted-foreground">
				Напишите в&nbsp;поддержку и&nbsp;расскажите, зачем вам больше: сколько устройств нужно
				и&nbsp;чьи они. Разберёмся индивидуально — лимит можно поднять и&nbsp;без смены тарифа.
			</p>
			<Button variant="outline" className="w-full" disabled={busy} onClick={() => void open()}>
				<MessageSquarePlusIcon className="size-4" />
				{busy ? 'Открываем чат…' : 'Попросить больше устройств'}
			</Button>
		</section>
	)
}
