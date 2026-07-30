import { reatomComponent } from '@reatom/react'
import { CircleHelp } from 'lucide-react'
import { navigate } from '@/state/screen.ts'
import { Layout } from '@/ui/components/Layout.tsx'
import { BackLink } from '@/ui/components/BackLink.tsx'
import { ctaClass } from '@/ui/cta.ts'
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from '@/components/ui/accordion.tsx'
import { FAQ_ITEMS, SUPPORT_EMAIL } from '@/ui/screens/faq-data.tsx'

export const Faq = reatomComponent(() => {
	return (
		<Layout>
			<main className="flex-1 px-4 py-8 w-full">
				<div className="mb-6">
					<p className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.2em] uppercase text-emerald-500 mb-2">
						<CircleHelp className="size-3.5" />
						доступ · оплата · настройка
					</p>
					<h1 className="text-2xl font-bold tracking-tight">Частые вопросы</h1>
				</div>

				<Accordion hiddenUntilFound>
					{FAQ_ITEMS.map((item) => (
						<AccordionItem key={item.id} value={item.id}>
							<AccordionTrigger>{item.q}</AccordionTrigger>
							<AccordionContent>{item.a}</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>

				<div className="border border-border rounded-xl p-5 mt-8">
					<p className="font-semibold text-sm mb-1">Остались вопросы?</p>
					<p className="text-sm text-muted-foreground leading-relaxed mb-4">
						Техподдержка отвечает прямо в&nbsp;чате Telegram-бота — попасть в&nbsp;него можно
						со&nbsp;страницы получения доступа. А&nbsp;если Telegram недоступен, можно написать
						на&nbsp;почту{' '}
						<a
							href={`mailto:${SUPPORT_EMAIL}`}
							className="text-emerald-500 hover:text-emerald-400 underline underline-offset-2"
						>
							{SUPPORT_EMAIL}
						</a>
						.
					</p>
					<button className={ctaClass} onClick={() => navigate('access')}>
						Получить доступ
					</button>
				</div>

				<div className="mt-6">
					<BackLink />
				</div>
			</main>
		</Layout>
	)
})
