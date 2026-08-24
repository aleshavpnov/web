/**
 * Экран «Друзья»: реферальная ссылка с QR, счётчики и список приглашённых.
 *
 * Карточка ссылки устроена как на «Подключении»: тогглер доменов, строка с копированием
 * по тапу и QR под кнопкой. Ссылка живёт в двух доменах: у части операторов основной
 * не открывается, и другу надо дать ту, что откроется у него.
 */
import { reatomComponent } from '@reatom/react'
import { useEffect, useState } from 'react'
import { InfoIcon, QrCodeIcon, Share2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button.tsx'
import { plural } from '@/lib/format.ts'
import { openLink } from '@/lib/telegram.ts'
import { referralsRes } from '@/state/cabinet.ts'
import { Avatar } from '@/ui/components/Avatar.tsx'
import {
	Async,
	CopyValue,
	Qr,
	SECTION_CARD,
	SectionTitle,
	Segmented,
	shorten,
	StatTile,
} from '@/ui/components/common.tsx'

type LinkKind = 'main' | 'backup'

/**
 * Зачем нужна каждая ссылка. Подпись стоит у обеих, а не только у запасной: иначе выбор
 * выглядит как «основная и какая-то ещё», и человек не понимает, когда брать вторую.
 */
const LINK_NOTE: Record<LinkKind, string> = {
	main: 'Обычная ссылка на сайт. Подойдёт большинству — с неё же друг получит пробный доступ.',
	backup:
		'Зеркало на другом домене. Дайте её, если у друга основной сайт не открывается — так бывает у части операторов и при ограничениях мобильного интернета.',
}

export const Referrals = reatomComponent(() => {
	const [kind, setKind] = useState<LinkKind>('main')
	const [showQr, setShowQr] = useState(false)

	useEffect(() => {
		void referralsRes.load()
	}, [])

	return (
		<Async
			data={referralsRes.dataAtom()}
			loading={referralsRes.loadingAtom()}
			error={referralsRes.errorAtom()}
			className="space-y-4"
		>
			{(refs) => {
				const link = kind === 'backup' && refs.linkBackup ? refs.linkBackup : refs.link

				return (
					<>
						<section className={SECTION_CARD}>
							<SectionTitle className="mb-1">Ваша ссылка</SectionTitle>
							<p className="mb-3 text-sm text-muted-foreground">
								Каждому, кто оплатит подписку по&nbsp;вашей ссылке, мы&nbsp;продлеваем вашу на&nbsp;
								{refs.rewardDays} {plural(refs.rewardDays, 'день', 'дня', 'дней')}.
							</p>

							{/* Переключатель и сноска — только когда зеркало настроено: иначе это выбор
							    из одного варианта. Сноска стоит до ссылки: сначала человек понимает,
							    какую берёт. */}
							{refs.linkBackup && (
								<>
									<Segmented
										className="mb-3"
										value={kind}
										onValueChange={setKind}
										options={[
											{ value: 'main', label: 'Основная' },
											{ value: 'backup', label: 'Запасная' },
										]}
									/>
									<p className="mb-3 flex items-start gap-2 rounded-lg bg-muted px-3 py-2.5 text-sm">
										<InfoIcon className="mt-0.5 size-4 shrink-0 text-brand" />
										<span>{LINK_NOTE[kind]}</span>
									</p>
								</>
							)}

							<CopyValue
								value={link}
								className="w-full justify-between rounded-lg bg-muted px-3 py-2.5 font-mono text-sm"
							>
								<span className="truncate">{shorten(link)}</span>
							</CopyValue>

							<Button
								variant="outline"
								className="mt-3 w-full"
								onClick={() =>
									openLink(
										`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Пользуюсь этим VPN — работает без танцев с бубном')}`,
									)
								}
							>
								<Share2Icon className="size-4" />
								Поделиться в Telegram
							</Button>

							{/* QR под кнопкой: переслать ссылку хотят чаще, чем показать код с экрана. */}
							<Button
								variant="outline"
								className="mt-2 w-full"
								onClick={() => setShowQr((v) => !v)}
							>
								<QrCodeIcon className="size-4" />
								{showQr ? 'Скрыть QR' : 'Показать QR'}
							</Button>

							{showQr && (
								<div className="mt-3">
									<Qr value={link} alt="QR-код реферальной ссылки" />
								</div>
							)}
						</section>

						<div className="grid grid-cols-3 gap-3">
							<StatTile label="Переходов" value={refs.clicks} />
							<StatTile label="Пришли" value={refs.joined} />
							<StatTile label="Оплатили" value={refs.paid} />
						</div>

						{refs.invited.length > 0 && (
							<section className={SECTION_CARD}>
								<SectionTitle>Вы пригласили</SectionTitle>
								<ul className="divide-y divide-border/60">
									{refs.invited.map((friend) => (
										<li key={friend.tgId} className="flex items-center gap-3 py-2">
											<Avatar tgId={friend.tgId} label={friend.label} />
											<span className="min-w-0 flex-1 truncate text-sm">{friend.label}</span>
											{/* Оплатившие отмечены словом, а не только цветом: это благодарность,
											    и она должна читаться. */}
											{friend.rewarded && (
												<span className="shrink-0 text-xs text-brand">оплатил</span>
											)}
										</li>
									))}
								</ul>
							</section>
						)}
					</>
				)
			}}
		</Async>
	)
}, 'Referrals')
