/**
 * Экран «Ещё»: настройки уведомлений, «что нового» и вход в поддержку.
 *
 * Переписка остаётся в чате бота: там уже работают топики группы поддержки, вложения и
 * уведомления. Кабинет только включает режим и уводит в чат.
 */
import { reatomComponent } from '@reatom/react'
import { useEffect, useState } from 'react'
import { ChevronDownIcon, ShieldIcon } from 'lucide-react'
import { toast } from 'sonner'

import { setSetting } from '@/api/client.ts'
import type { SettingKey } from '@/api/schemas.ts'
import { Button } from '@/components/ui/button.tsx'
import { Switch } from '@/components/ui/switch.tsx'
import { formatDate } from '@/lib/format.ts'
import { hapticError, openLink } from '@/lib/telegram.ts'
import { cn } from '@/lib/utils.ts'
import { overviewRes, settingsRes, whatsnewRes } from '@/state/cabinet.ts'
import { Async, SECTION_CARD, SectionTitle } from '@/ui/components/common.tsx'
import { SupportCard } from '@/ui/components/SupportCard.tsx'

const TOGGLES: Array<{ key: SettingKey; label: string; hint: string }> = [
	{
		key: 'notify',
		label: 'Уведомления о подписке',
		hint: 'Напоминания об окончании срока и оплате',
	},
	{ key: 'news', label: 'Анонсы обновлений', hint: 'Что нового в сервисе' },
	{ key: 'broadcast', label: 'Рассылки', hint: 'Редкие письма от команды' },
]

// reatomComponent обязателен: карточка сама читает атомы ресурса, а без обёртки
// компонент не подписан на них и остаётся с тем, что было на первом рендере (null).
const SettingsCard = reatomComponent(() => {
	const [busy, setBusy] = useState<SettingKey | null>(null)

	async function toggle(key: SettingKey, next: boolean) {
		setBusy(key)
		try {
			settingsRes.dataAtom.set(await setSetting(key, next))
		} catch (e) {
			hapticError()
			toast.error(e instanceof Error ? e.message : 'Не удалось сохранить')
		} finally {
			setBusy(null)
		}
	}

	return (
		<Async
			data={settingsRes.dataAtom()}
			loading={settingsRes.loadingAtom()}
			error={settingsRes.errorAtom()}
		>
			{(settings) => (
				<section className={SECTION_CARD}>
					<SectionTitle>Уведомления</SectionTitle>
					<ul className="divide-y divide-border/60">
						{TOGGLES.map(({ key, label, hint }) => (
							<li key={key} className="flex items-center justify-between gap-3 py-3">
								<label htmlFor={`toggle-${key}`} className="min-w-0 cursor-pointer">
									<div className="text-sm">{label}</div>
									<div className="text-xs text-muted-foreground">{hint}</div>
								</label>
								{/* Тумблер, а не кнопка с подписью: состояние читается по положению, и тап
								    по нему не выглядит как «отправить». */}
								<Switch
									id={`toggle-${key}`}
									checked={settings[key]}
									disabled={busy === key}
									onCheckedChange={(next) => void toggle(key, next)}
								/>
							</li>
						))}
					</ul>
				</section>
			)}
		</Async>
	)
}, 'SettingsCard')

const WhatsnewCard = reatomComponent(() => {
	const [open, setOpen] = useState(false)

	return (
		<Async
			data={whatsnewRes.dataAtom()}
			loading={whatsnewRes.loadingAtom()}
			error={whatsnewRes.errorAtom()}
		>
			{(data) =>
				data.items.length === 0 ? (
					<section className={SECTION_CARD}>
						<SectionTitle className="mb-0">Пока без новостей</SectionTitle>
					</section>
				) : (
					<section className={SECTION_CARD}>
						<SectionTitle>Что нового</SectionTitle>
						{/* Раскрываем только последнюю версию: остальные — история, за ней лезут редко. */}
						{data.items.slice(0, open ? undefined : 1).map((item) => (
							<article
								key={item.version}
								className="border-t border-border/60 py-3 first:border-0 first:pt-0"
							>
								<div className="flex items-baseline justify-between gap-2">
									<span className="text-sm font-semibold">v{item.version}</span>
									<span className="text-xs text-muted-foreground">{formatDate(item.date)}</span>
								</div>
								<p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">
									{item.body}
								</p>
							</article>
						))}
						{data.items.length > 1 && (
							<button
								type="button"
								onClick={() => setOpen((v) => !v)}
								className="flex min-h-11 w-full items-center justify-center gap-1 pt-2 text-sm text-brand"
							>
								{open ? 'Свернуть' : 'Показать прошлые версии'}
								<ChevronDownIcon
									className={cn('size-4 transition-transform', open && 'rotate-180')}
								/>
							</button>
						)}
					</section>
				)
			}
		</Async>
	)
}, 'WhatsnewCard')

/**
 * Вход в веб-админку — только тем, кому её отдаёт API (`adminMiniAppUrl`). Открываем через
 * `openTelegramLink`: админка живёт как Mini App и без Telegram-обёртки не авторизуется.
 */
function AdminCard({ url }: { url: string }) {
	return (
		<section className={SECTION_CARD}>
			<SectionTitle>Администрирование</SectionTitle>
			<Button variant="outline" className="w-full" onClick={() => openLink(url)}>
				<ShieldIcon className="size-4" />
				Веб-админка
			</Button>
		</section>
	)
}

export const More = reatomComponent(() => {
	const overview = overviewRes.dataAtom()
	const supportAvailable = overview?.support.available ?? false
	const adminUrl = overview?.adminMiniAppUrl ?? null

	useEffect(() => {
		void settingsRes.load()
		void whatsnewRes.load()
		// Кабинет могли открыть сразу на этой вкладке (перезагрузка вебвью помнит хеш) —
		// тогда overview ещё не загружался, а от него зависят и поддержка, и админка.
		if (overviewRes.dataAtom() === null) void overviewRes.load()
	}, [])

	return (
		<div className="space-y-4">
			<SettingsCard />
			{supportAvailable && <SupportCard />}
			{adminUrl && <AdminCard url={adminUrl} />}
			<WhatsnewCard />
		</div>
	)
}, 'More')
