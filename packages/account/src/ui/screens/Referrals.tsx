/**
 * Экран «Друзья»: реферальная ссылка, QR и счётчики.
 *
 * Имён приглашённых здесь нет — бот их и не отдаёт: кто именно пришёл по ссылке, это
 * данные того человека, а не пригласившего. Считаем переходы, регистрации и оплаты.
 */
import { reatomComponent } from '@reatom/react'
import { useEffect, useState } from 'react'
import { QrCodeIcon, Share2Icon } from 'lucide-react'
import QRCode from 'qrcode'

import { Button } from '@/components/ui/button.tsx'
import { plural } from '@/lib/format.ts'
import { openLink } from '@/lib/telegram.ts'
import { referralsRes } from '@/state/cabinet.ts'
import { Async, CopyValue, SECTION_CARD, SectionTitle, StatTile } from '@/ui/components/common.tsx'

function Qr({ link }: { link: string }) {
	const [qr, setQr] = useState<string | null>(null)

	useEffect(() => {
		let alive = true
		QRCode.toDataURL(link, { margin: 1, width: 320 })
			.then((data) => alive && setQr(data))
			.catch(() => alive && setQr(null))
		return () => {
			alive = false
		}
	}, [link])

	if (!qr) return null
	return (
		<img
			src={qr}
			alt="QR-код реферальной ссылки"
			className="mx-auto size-40 rounded-lg bg-white p-2"
		/>
	)
}

export const Referrals = reatomComponent(() => {
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
			{(refs) => (
				<>
					<section className={SECTION_CARD}>
						<SectionTitle className="mb-1">Ваша ссылка</SectionTitle>
						<p className="mb-3 text-sm text-muted-foreground">
							Каждому, кто оплатит подписку по&nbsp;вашей ссылке, мы&nbsp;продлеваем вашу на&nbsp;
							{refs.rewardDays} {plural(refs.rewardDays, 'день', 'дня', 'дней')}.
						</p>
						<CopyValue
							value={refs.link}
							className="w-full justify-between rounded-lg bg-muted px-3 py-2.5 font-mono text-sm"
						>
							<span className="truncate">{refs.link}</span>
						</CopyValue>

						<div className="mt-3 flex gap-2">
							<Button
								variant="outline"
								className="flex-1"
								onClick={() =>
									openLink(
										`https://t.me/share/url?url=${encodeURIComponent(refs.link)}&text=${encodeURIComponent('Пользуюсь этим VPN — работает без танцев с бубном')}`,
									)
								}
							>
								<Share2Icon className="size-4" />
								Поделиться
							</Button>
							<Button variant="outline" className="flex-1" onClick={() => setShowQr((v) => !v)}>
								<QrCodeIcon className="size-4" />
								{showQr ? 'Скрыть QR' : 'QR-код'}
							</Button>
						</div>

						{showQr && (
							<div className="mt-3">
								<Qr link={refs.link} />
							</div>
						)}
					</section>

					<div className="grid grid-cols-3 gap-3">
						<StatTile label="Переходов" value={refs.clicks} />
						<StatTile label="Пришли" value={refs.joined} />
						<StatTile label="Оплатили" value={refs.paid} />
					</div>
				</>
			)}
		</Async>
	)
}, 'Referrals')
