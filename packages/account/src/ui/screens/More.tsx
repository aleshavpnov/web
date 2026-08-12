/**
 * Экран «Ещё»: настройки уведомлений, «что нового» и вход в поддержку.
 *
 * Переписка остаётся в чате бота: там уже работают топики группы поддержки, вложения и
 * уведомления. Кабинет только включает режим и уводит в чат.
 */
import { reatomComponent } from '@reatom/react'
import { useEffect, useState } from 'react'
import { ChevronDownIcon, LifeBuoyIcon } from 'lucide-react'
import { toast } from 'sonner'

import { openSupport, setSetting } from '@/api/client.ts'
import type { SettingKey } from '@/api/schemas.ts'
import { Button } from '@/components/ui/button.tsx'
import { formatDate } from '@/lib/format.ts'
import { closeMiniApp, hapticError, openLink } from '@/lib/telegram.ts'
import { cn } from '@/lib/utils.ts'
import { overviewRes, settingsRes, whatsnewRes } from '@/state/cabinet.ts'
import { Async, SECTION_CARD, SectionTitle } from '@/ui/components/common.tsx'

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
								<div className="min-w-0">
									<div className="text-sm">{label}</div>
									<div className="text-xs text-muted-foreground">{hint}</div>
								</div>
								<Button
									size="sm"
									variant={settings[key] ? 'default' : 'outline'}
									disabled={busy === key}
									className={cn(
										'shrink-0',
										settings[key] && 'bg-brand text-brand-foreground hover:bg-brand/85',
									)}
									onClick={() => void toggle(key, !settings[key])}
								>
									{settings[key] ? 'Включены' : 'Выключены'}
								</Button>
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
								className="flex w-full items-center justify-center gap-1 pt-2 text-sm text-brand"
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

function SupportCard() {
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

export const More = reatomComponent(() => {
	const supportAvailable = overviewRes.dataAtom()?.support.available ?? false

	useEffect(() => {
		void settingsRes.load()
		void whatsnewRes.load()
		// Кабинет могли открыть сразу на этой вкладке (перезагрузка вебвью помнит хеш) —
		// тогда overview ещё не загружался, а от него зависит доступность поддержки.
		if (overviewRes.dataAtom() === null) void overviewRes.load()
	}, [])

	return (
		<div className="space-y-4">
			<SettingsCard />
			{supportAvailable && <SupportCard />}
			<WhatsnewCard />
		</div>
	)
}, 'More')
