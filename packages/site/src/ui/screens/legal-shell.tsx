import type { ReactNode } from 'react'
import { ShieldCheck } from 'lucide-react'
import { BackLink } from '@/ui/components/BackLink.tsx'
import { Layout } from '@/ui/components/Layout.tsx'

/** Название сервиса и общие реквизиты, используемые в юридических документах. */
export const SERVICE_NAME = 'Alesha Vepenov'
export const SERVICE_SITE = 'durov.aimuzov.online'
export const LEGAL_EMAIL = 'support@aimuzov.online'
/** Дата последней редакции документов (обновлять при изменениях). */
export const LEGAL_UPDATED = '30 июля 2026 г.'

const linkClass = 'text-emerald-500 hover:text-emerald-400 underline underline-offset-2'

/** Ссылка mailto на контакт поддержки. */
export function LegalEmail() {
	return (
		<a href={`mailto:${LEGAL_EMAIL}`} className={linkClass}>
			{LEGAL_EMAIL}
		</a>
	)
}

/** Заголовок раздела документа. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section className="mt-6">
			<h2 className="text-base font-semibold mb-2">{title}</h2>
			<div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
		</section>
	)
}

/** Маркированный список пунктов документа. */
export function List({ items }: { items: ReactNode[] }) {
	return (
		<ul className="list-disc pl-5 space-y-1">
			{items.map((item, i) => (
				// Порядок пунктов фиксирован и не меняется в рантайме — индекс как key допустим.
				// eslint-disable-next-line react/no-array-index-key
				<li key={i}>{item}</li>
			))}
		</ul>
	)
}

/**
 * Общий каркас юридической страницы: заголовок, дата редакции, контент и ссылка на главную.
 * Используется страницами «Политика конфиденциальности» и «Пользовательское соглашение».
 */
export function LegalShell({
	eyebrow,
	title,
	children,
}: {
	eyebrow: string
	title: string
	children: ReactNode
}) {
	return (
		<Layout>
			<main className="flex-1 px-4 py-8 w-full">
				<div className="mb-6">
					<p className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.2em] uppercase text-emerald-500 mb-2">
						<ShieldCheck className="size-3.5" />
						{eyebrow}
					</p>
					<h1 className="text-2xl font-bold tracking-tight">{title}</h1>
					<p className="text-xs text-muted-foreground mt-2">Редакция от {LEGAL_UPDATED}</p>
				</div>

				{children}

				<div className="mt-8">
					<BackLink />
				</div>
			</main>
		</Layout>
	)
}
