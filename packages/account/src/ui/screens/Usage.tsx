/**
 * Экран «Трафик»: сколько израсходовано за окно и с каких устройств.
 *
 * Ни адресов, ни доменов здесь нет и не будет — бот их в `/api/me` не отдаёт (см. шапку
 * cabinet-api.ts). Устройство названо моделью и датой последнего входа: этого хватает,
 * чтобы узнать своё и заметить чужое.
 */
import { reatomComponent } from '@reatom/react'
import { useEffect } from 'react'
import { ActivityIcon, SmartphoneIcon } from 'lucide-react'

import {
	BarsBone,
	Bone,
	ButtonBone,
	ListBone,
	RowBone,
	TextBone,
	TileBone,
} from '@shared/skeleton/index.ts'

import { formatBytes, formatDevices, plural } from '@/lib/format.ts'
import { usageDaysAtom, usageRes } from '@/state/cabinet.ts'
import { Async, SECTION_CARD, SectionTitle, Segmented, StatTile } from '@/ui/components/common.tsx'
import { DeviceList } from '@/ui/components/DeviceList.tsx'
import { MoreDevicesCard } from '@/ui/components/MoreDevicesCard.tsx'
import { UsageBars } from '@/ui/components/UsageBars.tsx'

const WINDOWS = [
	{ value: '1', label: 'Сутки' },
	{ value: '7', label: '7 дней' },
	{ value: '30', label: '30 дней' },
] as const

/**
 * Скелетон экрана: две плитки, карточка графика, список устройств. Столбики в карточке
 * ростом ровно с `UsageBars` (140), поэтому график встаёт на своё место без прыжка.
 */
const SKELETON = (
	<div className="space-y-4">
		<div className="grid grid-cols-2 gap-3">
			<TileBone className={SECTION_CARD} Icon={ActivityIcon} value="w-20" hint="w-28" />
			<TileBone className={SECTION_CARD} Icon={SmartphoneIcon} value="w-8" hint="w-24" />
		</div>

		<section className={SECTION_CARD}>
			<TextBone line="h-5" className="mb-2 h-3.5 w-36" />
			<BarsBone count={24} gap="gap-0.5" />
		</section>

		<section className={SECTION_CARD}>
			<TextBone line="h-5" className="mb-2 h-3.5 w-28" />
			{/* Три строки — столько устройств у большинства: телефон, ноутбук и планшет. */}
			<ListBone
				className="divide-y divide-border/60"
				count={3}
				row={
					<RowBone
						className="py-2"
						leading={<SmartphoneIcon className="size-4 shrink-0 text-muted-foreground/40" />}
						lines={['w-40', 'w-52']}
						tail={
							<div className="flex shrink-0 gap-1">
								<Bone className="size-9" />
								<Bone className="size-9" />
							</div>
						}
					/>
				}
			/>
			<div className="mt-4 border-t border-border/60 pt-4">
				<ButtonBone />
			</div>
		</section>
	</div>
)

export const Usage = reatomComponent(() => {
	const days = usageDaysAtom()

	useEffect(() => {
		void usageRes.load(days)
	}, [days])

	return (
		<div className="space-y-4">
			<Segmented
				value={String(days)}
				onValueChange={(v) => usageDaysAtom.set(Number(v))}
				options={WINDOWS}
			/>

			<Async
				data={usageRes.dataAtom()}
				loading={usageRes.loadingAtom()}
				error={usageRes.errorAtom()}
				className="space-y-4"
				skeleton={SKELETON}
			>
				{(usage) =>
					!usage.available ? (
						<section className={SECTION_CARD}>
							<div className="font-semibold">Учёт трафика не ведётся</div>
							<p className="mt-2 text-sm text-muted-foreground">
								Он появится, когда у&nbsp;вас будет действующая подписка.
							</p>
						</section>
					) : (
						<>
							<div className="grid grid-cols-2 gap-3">
								<StatTile
									label={`Израсходовано за ${usage.windowDays} ${plural(usage.windowDays, 'день', 'дня', 'дней')}`}
									value={formatBytes(usage.usedBytes)}
									hint={`в среднем ${formatBytes(Math.round(usage.avgPerDayBytes))} в сутки`}
								/>
								<StatTile
									label="Устройств за окно"
									value={usage.devices.length}
									hint={
										usage.deviceLimit === null
											? 'без ограничения'
											: `лимит тарифа — ${formatDevices(usage.deviceLimit)}`
									}
								/>
							</div>

							{/* История снимков бывает короче запрошенного окна — тогда цифры считаются
							    по тому, что есть, и молчать об этом нельзя. */}
							{usage.historyDays < usage.windowDays && (
								<p className="text-xs text-muted-foreground">
									Данные есть только за последние {Math.floor(usage.historyDays)}{' '}
									{plural(Math.floor(usage.historyDays), 'день', 'дня', 'дней')} — цифры посчитаны
									по ним.
								</p>
							)}

							<section className={SECTION_CARD}>
								<SectionTitle>
									Расход по {usage.granularity === 'hour' ? 'часам' : 'дням'}
								</SectionTitle>
								<UsageBars points={usage.series} granularity={usage.granularity} />
							</section>

							<DeviceList devices={usage.devices} onChanged={() => usageRes.load(days)} />

							{/* Показываем всем, у кого лимит вообще есть, а не только упёршимся в него:
							    счёт устройств — нижняя граница (hwid шлёт только Happ), и порог по нему
							    прятал бы карточку как раз от тех, кому она нужна. У безлимитных
							    (подписки до тарифной линейки, vip) просить нечего. */}
							{usage.deviceLimit !== null && <MoreDevicesCard />}
						</>
					)
				}
			</Async>
		</div>
	)
}, 'Usage')
