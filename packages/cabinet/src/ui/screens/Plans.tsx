/**
 * Экран «Тарифы»: подбор тарифа, управление оплатой и подарочные сертификаты.
 *
 * Деньги живут в Tribute — кабинет только уводит туда ссылкой. Своей формы оплаты нет и
 * быть не должно: карту клиента мы не видим и видеть не хотим.
 *
 * Полная витрина вынесена на отдельный экран «Все тарифы»: здесь ведём диалогом, а список
 * для тех, кто уже решил. Ссылки на витрину и Tribute собраны в секцию «Дополнительно»
 * внизу — раньше они стояли кнопками вперемешку с оплатой и спорили с ней за внимание.
 */
import { reatomComponent } from '@reatom/react'
import { useEffect } from 'react'
import {
	ChevronRightIcon,
	ExternalLinkIcon,
	ListIcon,
	RotateCcwIcon,
	SettingsIcon,
} from 'lucide-react'

import { Bone, ButtonBone, ListBone } from '@shared/skeleton/index.ts'

import { trackEvent } from '@/api/client.ts'
import { openLink } from '@/lib/telegram.ts'
import { cn } from '@/lib/utils.ts'
import { plansRes } from '@/state/cabinet.ts'
import { navigate } from '@/state/screen.ts'
import { stepAtom, wizardReset } from '@/state/wizard.ts'
import { Async, CopyValue, SECTION_CARD, SectionTitle } from '@/ui/components/common.tsx'
import { Wizard } from '@/ui/screens/purchase/Wizard.tsx'

/**
 * Скелетон экрана: полоска шагов визарда, вопрос и карточки ответов. Первый шаг всегда
 * один и тот же — «кому подписка» с тремя вариантами, поэтому форма известна заранее.
 */
const SKELETON = (
	<div className="space-y-4">
		<section>
			<div className="mb-4 flex gap-1.5">
				<Bone className="h-1 flex-1 rounded-full" />
				<Bone className="h-1 flex-1 rounded-full" />
				<Bone className="h-1 flex-1 rounded-full" />
			</div>
			<div className="space-y-3">
				<div className="flex h-7 items-center">
					<Bone className="h-5 w-48" />
				</div>
				<ListBone
					className="space-y-3"
					count={3}
					row={
						<div className={cn(SECTION_CARD, 'flex items-center gap-3')}>
							<Bone className="size-6 shrink-0 rounded-full" />
							<div className="min-w-0 flex-1 space-y-1.5">
								<Bone className="h-4 w-28" />
								<Bone className="h-3 w-44" />
							</div>
						</div>
					}
				/>
			</div>
		</section>

		<ButtonBone />
	</div>
)

/** Пункт секции «Дополнительно»: строка-кнопка с иконкой, как настройки на «Ещё». */
function ExtraRow({
	label,
	Icon,
	external = false,
	onClick,
}: {
	label: string
	Icon: typeof ListIcon
	/** Действие уводит из кабинета (Tribute) — вместо шеврона значок внешней ссылки. */
	external?: boolean
	onClick: () => void
}) {
	const Tail = external ? ExternalLinkIcon : ChevronRightIcon
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex min-h-11 w-full items-center gap-3 py-3 text-left text-sm transition-colors hover:text-brand"
		>
			<Icon className="size-4 shrink-0 text-muted-foreground" />
			<span className="min-w-0 flex-1">{label}</span>
			<Tail className="size-4 shrink-0 text-muted-foreground" />
		</button>
	)
}

export const Plans = reatomComponent(() => {
	const step = stepAtom()

	useEffect(() => {
		void plansRes.load()
	}, [])

	function openList() {
		trackEvent('plans_list_open')
		navigate('tariffs')
	}

	return (
		<Async
			data={plansRes.dataAtom()}
			loading={plansRes.loadingAtom()}
			error={plansRes.errorAtom()}
			className="space-y-4"
			skeleton={SKELETON}
		>
			{(data) => (
				<>
					<Wizard />

					<section className={cn(SECTION_CARD, 'py-2')}>
						<SectionTitle className="mt-2 mb-0">Дополнительно</SectionTitle>
						<div className="divide-y divide-border/60">
							{step === 'result' && (
								<ExtraRow
									label="Ответить заново"
									Icon={RotateCcwIcon}
									onClick={() => wizardReset()}
								/>
							)}
							<ExtraRow label="Все тарифы" Icon={ListIcon} onClick={openList} />
							{data.manageUrl && (
								<ExtraRow
									label="Управлять подпиской в Tribute"
									Icon={SettingsIcon}
									external
									onClick={() => openLink(data.manageUrl!)}
								/>
							)}
						</div>
					</section>

					{data.pendingGifts.length > 0 && (
						<section className={SECTION_CARD}>
							<SectionTitle className="mb-1">Ваши сертификаты</SectionTitle>
							<p className="mb-3 text-xs text-muted-foreground">
								Перешлите ссылку тому, кому дарите: доступ включится, когда он её откроет.
							</p>
							<div className="space-y-2">
								{data.pendingGifts.map((gift) => (
									<CopyValue
										key={gift.deepLink}
										value={gift.deepLink}
										className="w-full justify-between rounded-lg bg-muted px-3 py-2 text-sm"
									>
										<span className="truncate">{gift.planName}</span>
									</CopyValue>
								))}
							</div>
						</section>
					)}
				</>
			)}
		</Async>
	)
}, 'Plans')
