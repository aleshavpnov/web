/**
 * Экран «Друзья»: реферальная ссылка с QR, счётчики и список приглашённых.
 *
 * QR во всю ширину — его показывают с экрана телефона другому телефону, и мелкий код
 * с расстояния не считывается. Ссылка живёт в двух доменах: у части операторов основной
 * не открывается, и другу надо дать ту, что откроется у него (тот же приём, что с
 * запасной ссылкой-подпиской на экране «Подключение»).
 */
import { reatomComponent } from '@reatom/react'
import { useEffect, useState } from 'react'
import { CheckIcon, CopyIcon, Share2Icon } from 'lucide-react'
import QRCode from 'qrcode'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button.tsx'
import { copyText } from '@/lib/clipboard.ts'
import { plural } from '@/lib/format.ts'
import { openLink } from '@/lib/telegram.ts'
import { cn } from '@/lib/utils.ts'
import { referralsRes } from '@/state/cabinet.ts'
import { Avatar } from '@/ui/components/Avatar.tsx'
import {
	Async,
	BRAND_ON,
	SECTION_CARD,
	SectionTitle,
	Segmented,
	StatTile,
} from '@/ui/components/common.tsx'

/** Сколько держится галочка на кнопке после копирования. */
const COPIED_MS = 1400

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

/** QR во всю ширину карточки: код рисуем крупно, чтобы читался с чужого телефона. */
function Qr({ link }: { link: string }) {
	const [qr, setQr] = useState<string | null>(null)

	useEffect(() => {
		let alive = true
		// width 1024 — с запасом под ширину экрана на ретине: масштабируем вниз, не вверх.
		QRCode.toDataURL(link, { margin: 1, width: 1024 })
			.then((data) => alive && setQr(data))
			.catch(() => alive && setQr(null))
		return () => {
			alive = false
		}
	}, [link])

	return (
		<div className="aspect-square w-full overflow-hidden rounded-xl bg-white p-3">
			{qr && <img src={qr} alt="QR-код реферальной ссылки" className="size-full" />}
		</div>
	)
}

export const Referrals = reatomComponent(() => {
	const [kind, setKind] = useState<LinkKind>('main')
	const [copied, setCopied] = useState(false)

	useEffect(() => {
		void referralsRes.load()
	}, [])

	useEffect(() => {
		if (!copied) return
		const timer = setTimeout(() => setCopied(false), COPIED_MS)
		return () => clearTimeout(timer)
	}, [copied])

	return (
		<Async
			data={referralsRes.dataAtom()}
			loading={referralsRes.loadingAtom()}
			error={referralsRes.errorAtom()}
			className="space-y-4"
		>
			{(refs) => {
				const link = kind === 'backup' && refs.linkBackup ? refs.linkBackup : refs.link

				async function copy() {
					if (await copyText(link)) {
						setCopied(true)
						toast.success('Ссылка скопирована')
					} else {
						toast.error('Не удалось скопировать')
					}
				}

				return (
					<>
						<section className={SECTION_CARD}>
							<SectionTitle className="mb-1">Ваша ссылка</SectionTitle>
							<p className="mb-3 text-sm text-muted-foreground">
								Каждому, кто оплатит подписку по&nbsp;вашей ссылке, мы&nbsp;продлеваем вашу на&nbsp;
								{refs.rewardDays} {plural(refs.rewardDays, 'день', 'дня', 'дней')}.
							</p>

							{/* Переключатель доменов появляется только когда зеркало настроено:
							    иначе это выбор из одного варианта. */}
							{refs.linkBackup && (
								<Segmented
									className="mb-3"
									value={kind}
									onValueChange={setKind}
									options={[
										{ value: 'main', label: 'Основная' },
										{ value: 'backup', label: 'Запасная' },
									]}
								/>
							)}

							<p className="truncate rounded-lg bg-muted px-3 py-2 text-center font-mono text-xs text-muted-foreground">
								{link}
							</p>

							{/* Сноска нужна обеим: без неё переключатель не объясняет, зачем второй домен.
							    Когда зеркала нет, выбора тоже нет — и подпись про «основную» лишняя. */}
							{refs.linkBackup && (
								<p className="mt-2 text-xs text-muted-foreground">{LINK_NOTE[kind]}</p>
							)}

							<Button className={cn('mt-3 w-full', BRAND_ON)} size="lg" onClick={() => void copy()}>
								{copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
								{copied ? 'Скопировано' : 'Скопировать ссылку'}
							</Button>
							<Button
								variant="outline"
								className="mt-2 w-full"
								onClick={() =>
									openLink(
										`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Пользуюсь этим VPN — работает без танцев с бубном')}`,
									)
								}
							>
								<Share2Icon className="size-4" />
								Поделиться в Telegram
							</Button>

							{/* QR ниже кнопок: переслать ссылку хочется чаще, чем показать код с экрана,
							    и первым под руку должно попадать частое. */}
							<div className="mt-4">
								<Qr link={link} />
							</div>
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
