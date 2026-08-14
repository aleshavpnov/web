/**
 * Экран «Подписка»: подбор тарифа, управление оплатой и подарочные сертификаты.
 *
 * Деньги живут в Tribute — кабинет только уводит туда ссылкой. Своей формы оплаты нет и
 * быть не должно: карту клиента мы не видим и видеть не хотим.
 *
 * Полная витрина вынесена на отдельный экран «Тарифы»: здесь ведём диалогом, а список для
 * тех, кто уже решил.
 */
import { reatomComponent } from '@reatom/react'
import { useEffect } from 'react'
import { ExternalLinkIcon, ListIcon, SettingsIcon } from 'lucide-react'

import { trackEvent } from '@/api/client.ts'
import { Button } from '@/components/ui/button.tsx'
import { openLink } from '@/lib/telegram.ts'
import { plansRes } from '@/state/cabinet.ts'
import { navigate } from '@/state/screen.ts'
import { Async, CopyValue, SECTION_CARD, SectionTitle } from '@/ui/components/common.tsx'
import { Wizard } from '@/ui/screens/purchase/Wizard.tsx'

export const Plans = reatomComponent(() => {
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
		>
			{(data) => (
				<>
					<Wizard />

					<Button variant="outline" className="w-full" onClick={openList}>
						<ListIcon className="size-4" />
						Показать все тарифы
					</Button>

					{data.manageUrl && (
						<Button variant="outline" className="w-full" onClick={() => openLink(data.manageUrl!)}>
							<SettingsIcon className="size-4" />
							Управлять подпиской в Tribute
							<ExternalLinkIcon className="size-3.5 opacity-60" />
						</Button>
					)}

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
