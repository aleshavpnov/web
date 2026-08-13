/**
 * Главный экран: что у клиента с доступом прямо сейчас и что с этим делать дальше.
 *
 * Порядок блоков — по частоте нужды: состояние подписки → «подключиться» → продлить.
 * Всё остальное (трафик, друзья, настройки) живёт на своих вкладках.
 */
import { reatomComponent } from '@reatom/react'
import { useEffect } from 'react'
import {
	ActivityIcon,
	CalendarClockIcon,
	CreditCardIcon,
	GiftIcon,
	PlugZapIcon,
	ShieldCheckIcon,
	SmartphoneIcon,
	UsersIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button.tsx'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { formatBytes, formatDate, formatDevices, formatRemaining, daysLeft } from '@/lib/format.ts'
import { cn } from '@/lib/utils.ts'
import { overviewRes, summaryRes } from '@/state/cabinet.ts'
import { navigate } from '@/state/screen.ts'
import type { Overview } from '@/api/schemas.ts'
import {
	Async,
	BRAND_ON,
	Row,
	SECTION_CARD,
	SectionTitle,
	StatTile,
} from '@/ui/components/common.tsx'
import { SupportCard } from '@/ui/components/SupportCard.tsx'

/** Ниже скольких дней срок подписки подсвечивается предупреждением. */
const SOON_DAYS = 5

const STATUS_NOTE: Record<string, string> = {
	// Отменённая подписка работает до конца оплаченного срока — это не поломка,
	// но продлевать её никто не будет, и сказать об этом надо заранее.
	cancelled: 'Автопродление выключено — после этой даты доступ закончится',
	pending: 'Ждём подтверждения оплаты. Обычно это занимает пару минут',
	expired: 'Срок закончился — продлите подписку, чтобы вернуть доступ',
}

function PaidCard({ data }: { data: Overview & { sub: NonNullable<Overview['sub']> } }) {
	const { sub } = data
	const left = daysLeft(sub.expiresAt)
	const soon = left <= SOON_DAYS
	const note = STATUS_NOTE[sub.status]

	return (
		<section className={SECTION_CARD}>
			<div className="flex items-start justify-between gap-3">
				<div>
					<div className="text-xs text-muted-foreground">Ваш тариф</div>
					<div className="mt-0.5 text-xl font-semibold">
						{sub.planEmoji ? `${sub.planEmoji} ` : ''}
						{sub.planName}
					</div>
				</div>
				{sub.deviceLimit !== null && (
					<div className="text-right text-xs text-muted-foreground">
						{formatDevices(sub.deviceLimit)}
					</div>
				)}
			</div>

			<div
				className={cn(
					'mt-3 flex items-center gap-2 text-sm',
					soon ? 'text-viz-warning' : 'text-foreground',
				)}
			>
				<CalendarClockIcon className="size-4 shrink-0" />
				<span>
					{formatRemaining(sub.expiresAt)} · до {formatDate(sub.expiresAt)}
				</span>
			</div>

			{note && <p className="mt-2 text-xs text-muted-foreground">{note}</p>}

			{/* Списание Tribute показываем только когда оно расходится с концом доступа:
			    совпало — вторая дата ничего не добавляет, а вопросов вызывает много. */}
			{sub.tributeExpiresAt && formatDate(sub.tributeExpiresAt) !== formatDate(sub.expiresAt) && (
				<Row label="Следующее списание">{formatDate(sub.tributeExpiresAt)}</Row>
			)}
		</section>
	)
}

function VipCard({ expiresAt }: { expiresAt: string | null }) {
	return (
		<section className={SECTION_CARD}>
			<div className="flex items-center gap-2 text-xl font-semibold">
				<ShieldCheckIcon className="size-5 text-brand" />
				Особый доступ
			</div>
			<p className="mt-2 text-sm text-muted-foreground">
				{expiresAt
					? `Действует до ${formatDate(expiresAt)}.`
					: 'Действует бессрочно, оплачивать ничего не нужно.'}
			</p>
		</section>
	)
}

function NoAccessCard({ data }: { data: Overview }) {
	return (
		<section className={SECTION_CARD}>
			<div className="text-xl font-semibold">Доступа пока нет</div>
			<p className="mt-2 text-sm text-muted-foreground">
				{data.trial.available
					? `Начните с бесплатного пробного периода на ${data.trial.days} дн. — его выдаёт бот в чате.`
					: 'Выберите тариф — доступ включится сразу после оплаты.'}
			</p>
		</section>
	)
}

/** Сколько осталось доступа — коротко, для плитки: «12 дн.», «бессрочно» или «нет». */
function accessLeft(overview: Overview): string {
	if (overview.kind === 'vip') {
		return overview.vip?.expiresAt ? `${daysLeft(overview.vip.expiresAt)} дн.` : 'бессрочно'
	}
	if (overview.kind === 'paid' && overview.sub) {
		const left = daysLeft(overview.sub.expiresAt)
		return left > 0 ? `${left} дн.` : 'истёк'
	}
	return 'нет'
}

/**
 * Плитки-виджеты: расход, устройства, приглашённые, срок. Каждая ведёт в свой раздел —
 * главная отвечает на «как дела», подробности живут на вкладках.
 *
 * Считаются отдельным запросом (`/summary`): агрегат по снимкам трафика тяжелее карточки
 * подписки, и заставлять её ждать незачем — плитки появляются следом.
 */
const Widgets = reatomComponent<{ overview: Overview }>(({ overview }) => {
	const summary = summaryRes.dataAtom()

	useEffect(() => {
		void summaryRes.load()
	}, [])

	if (summaryRes.errorAtom()) return null
	if (!summary) {
		return (
			<div className="grid grid-cols-2 gap-3">
				<Skeleton className="h-24" />
				<Skeleton className="h-24" />
			</div>
		)
	}

	return (
		<div className="grid grid-cols-2 gap-3">
			<StatTile
				label={`Трафик за ${summary.windowDays} дн.`}
				Icon={ActivityIcon}
				value={summary.usedBytes === null ? '—' : formatBytes(summary.usedBytes)}
				hint="подробнее"
				onClick={() => navigate('usage')}
			/>
			<StatTile
				label="Устройства"
				Icon={SmartphoneIcon}
				value={summary.devices ?? '—'}
				hint={
					summary.deviceLimit === null ? 'без ограничения' : `из ${summary.deviceLimit} по тарифу`
				}
				onClick={() => navigate('usage')}
			/>
			<StatTile
				label="Друзья"
				Icon={UsersIcon}
				value={summary.referrals.joined}
				hint={`оплатили ${summary.referrals.paid}`}
				onClick={() => navigate('refs')}
			/>
			{/* Четвёртая плитка — срок: то же число, что в карточке выше, но рядом с остальными
			    цифрами и с переходом к тарифам. У VIP срока обычно нет — тогда «бессрочно». */}
			<StatTile
				label="Доступ"
				Icon={CalendarClockIcon}
				value={accessLeft(overview)}
				hint={overview.kind === 'paid' ? 'продлить или сменить' : 'выбрать тариф'}
				onClick={() => navigate('plans')}
			/>
		</div>
	)
}, 'Widgets')

export const Home = reatomComponent(() => {
	const data = overviewRes.dataAtom()

	useEffect(() => {
		void overviewRes.load()
	}, [])

	return (
		<Async
			data={data}
			loading={overviewRes.loadingAtom()}
			error={overviewRes.errorAtom()}
			className="space-y-4"
		>
			{(overview) => {
				const hasAccess = overview.kind !== 'none'
				return (
					<>
						{overview.kind === 'paid' && overview.sub ? (
							<PaidCard data={{ ...overview, sub: overview.sub }} />
						) : overview.kind === 'vip' ? (
							<VipCard expiresAt={overview.vip?.expiresAt ?? null} />
						) : (
							<NoAccessCard data={overview} />
						)}

						<div className="space-y-2">
							{hasAccess && (
								<Button className={cn('w-full', BRAND_ON)} onClick={() => navigate('connect')}>
									<PlugZapIcon className="size-4" />
									Подключиться
								</Button>
							)}
							<Button
								variant={hasAccess ? 'outline' : 'default'}
								className={cn('w-full', !hasAccess && BRAND_ON)}
								onClick={() => navigate('plans')}
							>
								<CreditCardIcon className="size-4" />
								{overview.kind === 'paid' ? 'Продлить или сменить тариф' : 'Выбрать тариф'}
							</Button>
						</div>

						{/* Плитки — только тем, у кого есть доступ: без него в них одни прочерки,
						    а на экране и так стоит призыв выбрать тариф. */}
						{hasAccess && <Widgets overview={overview} />}

						{overview.pendingGifts > 0 && (
							<section className={SECTION_CARD}>
								<SectionTitle className="mb-1">Неактивированные подарки</SectionTitle>
								<p className="text-sm text-muted-foreground">
									У вас {overview.pendingGifts} оплаченный сертификат — ссылки для получателя лежат
									на вкладке «Подписка».
								</p>
								<Button variant="outline" className="mt-3 w-full" onClick={() => navigate('plans')}>
									<GiftIcon className="size-4" />
									Открыть подарки
								</Button>
							</section>
						)}

						{overview.support.available && <SupportCard />}
					</>
				)
			}}
		</Async>
	)
}, 'Home')
