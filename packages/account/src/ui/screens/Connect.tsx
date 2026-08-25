/**
 * Экран «Подключение»: ссылка-подписка + инструкция для выбранного приложения и платформы.
 *
 * Инструкция — общая с лендингом (`packages/shared-ui`): человек, дошедший до кабинета
 * после сайта, видит ровно те же шаги, а править их приходится в одном месте.
 */
import { reatomComponent } from '@reatom/react'
import { useEffect, useState } from 'react'
import { DownloadIcon, InfoIcon, QrCodeIcon, RouterIcon } from 'lucide-react'
import { toast } from 'sonner'
import {
	AddSubscriptionSteps,
	CLIENTS,
	ClientLink,
	ClientToggle,
	detectPlatform,
	InstallSteps,
	PlatformDialog,
	type ClientId,
} from '@shared/connect/index.ts'
import { Bone, ButtonBone, ListBone, TextBone } from '@shared/skeleton/index.ts'

import { sendKeeneticConf } from '@/api/client.ts'
import { Button } from '@/components/ui/button.tsx'
import { closeMiniApp, hapticError, openLink } from '@/lib/telegram.ts'
import { cn } from '@/lib/utils.ts'
import { accessRes } from '@/state/cabinet.ts'
import { navigate } from '@/state/screen.ts'
import {
	Async,
	BRAND_ON,
	CopyValue,
	Qr,
	SECTION_CARD,
	SectionTitle,
	Segmented,
	shorten,
} from '@/ui/components/common.tsx'

type LinkKind = 'main' | 'backup'

/**
 * Зачем нужна каждая ссылка. Подпись стоит у обеих, а не только у запасной: иначе выбор
 * выглядит как «основная и какая-то ещё», и человек не понимает, когда брать вторую.
 */
const LINK_NOTE: Record<LinkKind, string> = {
	main: 'Обычная ссылка-подписка. Подойдёт большинству — начинайте с неё.',
	backup:
		'Тот же доступ на другом домене. Возьмите её, если основная перестала открываться у вашего оператора.',
}

/** Ссылка-подписка: копирование одним тапом + QR для соседнего устройства. */
function SubscriptionLink({ url, backup }: { url: string; backup: string | null }) {
	const [kind, setKind] = useState<LinkKind>('main')
	const [showQr, setShowQr] = useState(false)
	const link = kind === 'backup' && backup ? backup : url

	return (
		<section className={SECTION_CARD}>
			<SectionTitle className="mb-3">Ссылка-подписка</SectionTitle>

			{/* Переключатель доменов появляется только когда зеркало настроено:
			    иначе это выбор из одного варианта. */}
			{backup && (
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

			<Button variant="outline" className="mt-3 w-full" onClick={() => setShowQr((v) => !v)}>
				<QrCodeIcon className="size-4" />
				{showQr ? 'Скрыть QR' : 'Показать QR'}
			</Button>

			{showQr && (
				<div className="mt-3 flex flex-col items-center gap-2">
					<Qr value={link} alt="QR-код ссылки-подписки" />
					<p className="text-center text-xs text-muted-foreground">
						Отсканируйте с&nbsp;другого устройства — приложение добавит подписку само.
					</p>
				</div>
			)}
		</section>
	)
}

/**
 * Персональный конфиг для роутера — доступен на тарифах от 10 устройств.
 *
 * Файл приходит документом в чат бота, а не в загрузки: вебвью Mini App не отдаёт
 * blob-ссылку загрузчику ни на одном клиенте, и кнопка «скачать» молча не делала ничего.
 * Дальше — как у поддержки: открываем чат и закрываемся, чтобы не оставлять кабинет
 * поверх диалога, в котором лежит файл.
 */
function RouterCard() {
	const [busy, setBusy] = useState(false)

	async function send() {
		setBusy(true)
		try {
			const { botLink } = await sendKeeneticConf()
			openLink(botLink)
			closeMiniApp()
		} catch (e) {
			hapticError()
			toast.error(e instanceof Error ? e.message : 'Не удалось получить конфиг')
		} finally {
			setBusy(false)
		}
	}

	return (
		<section className={SECTION_CARD}>
			<SectionTitle className="mb-1">Роутер Keenetic</SectionTitle>
			<p className="mb-3 text-sm text-muted-foreground">
				Раздаёт доступ на&nbsp;всю домашнюю сеть — приложение на&nbsp;устройствах не&nbsp;нужно.
				Файл настроек и&nbsp;шаги импорта пришлём в&nbsp;чат бота.
			</p>
			<Button variant="outline" className="w-full" disabled={busy} onClick={() => void send()}>
				<RouterIcon className="size-4" />
				{busy ? 'Отправляем…' : 'Прислать конфиг в чат'}
			</Button>
		</section>
	)
}

/**
 * Скелетон экрана: карточка ссылки и карточка инструкции. Шаги — четыре строки текста
 * с местом под номер: инструкция всегда длиннее ссылки, и без неё карточка выглядела бы
 * вдвое короче будущей.
 */
const SKELETON = (
	<div className="space-y-4">
		<section className={SECTION_CARD}>
			<TextBone line="h-5" className="mb-3 h-3.5 w-36" />
			<Bone className="h-11 w-full rounded-lg" />
			<ButtonBone className="mt-3 h-11 w-full" />
		</section>

		<section className={SECTION_CARD}>
			<div className="mb-3 flex items-center justify-between gap-2">
				<TextBone line="h-5" className="h-3.5 w-32" />
				<TextBone line="h-5" className="h-3 w-32" />
			</div>
			<Bone className="h-11 w-56 rounded-lg" />
			<div className="mt-3 mb-3 space-y-1.5">
				<Bone className="h-3.5 w-full" />
				<Bone className="h-3.5 w-2/3" />
			</div>
			<ListBone
				className="space-y-3"
				count={4}
				row={
					<div className="flex gap-3">
						<Bone className="h-5 w-14 shrink-0" />
						<div className="min-w-0 flex-1 space-y-1.5">
							<Bone className="h-3.5 w-full" />
							<Bone className="h-3.5 w-1/2" />
						</div>
					</div>
				}
			/>
		</section>
	</div>
)

export const Connect = reatomComponent(() => {
	const [client, setClient] = useState<ClientId>('happ')
	const [platform, setPlatform] = useState(detectPlatform)
	const [platformOpen, setPlatformOpen] = useState(false)
	const cfg = CLIENTS[client]
	const error = accessRes.errorAtom()

	useEffect(() => {
		void accessRes.load()
	}, [])

	// 409 — подписки нет. Это состояние экрана, а не сбой: показываем, что делать дальше.
	if (error && /подписки нет/i.test(error)) {
		return (
			<section className={SECTION_CARD}>
				<div className="text-lg font-semibold">Ссылки пока нет</div>
				<p className="mt-2 text-sm text-muted-foreground">
					Она появится здесь сразу после оплаты или выдачи пробного периода.
				</p>
				<Button className={cn('mt-4 w-full', BRAND_ON)} onClick={() => navigate('plans')}>
					Выбрать тариф
				</Button>
			</section>
		)
	}

	return (
		<Async
			data={accessRes.dataAtom()}
			loading={accessRes.loadingAtom()}
			error={error}
			className="space-y-4"
			skeleton={SKELETON}
		>
			{(access) => (
				<>
					<SubscriptionLink url={access.subscriptionUrl} backup={access.subscriptionUrlBackup} />

					<section className={SECTION_CARD}>
						<div className="mb-3 flex items-center justify-between gap-2">
							<SectionTitle className="mb-0">Как подключить</SectionTitle>
							<button
								type="button"
								onClick={() => setPlatformOpen(true)}
								className="min-h-11 px-1 text-sm text-brand underline underline-offset-2"
							>
								другое устройство?
							</button>
						</div>

						<ClientToggle value={client} onChange={setClient} />

						<p className="mt-3 mb-3 text-sm text-muted-foreground">
							Установите и&nbsp;настройте <ClientLink client={cfg} /> — приложение,
							через&nbsp;которое работает соединение.
						</p>
						<InstallSteps client={cfg} platform={platform} />

						<div className="mt-4 border-t border-border/60 pt-4">
							<p className="mb-3 text-sm text-muted-foreground">
								Добавьте ссылку-подписку в&nbsp;{cfg.name}:
							</p>
							<AddSubscriptionSteps client={cfg} />
						</div>
					</section>

					{access.canUseRouter && <RouterCard />}

					<p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
						<DownloadIcon className="size-3.5" />
						Ссылка одна на все ваши устройства
					</p>

					<PlatformDialog
						open={platformOpen}
						current={platform}
						onSelect={setPlatform}
						onClose={() => setPlatformOpen(false)}
					/>
				</>
			)}
		</Async>
	)
}, 'Connect')
