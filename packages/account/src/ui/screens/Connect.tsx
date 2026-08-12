/**
 * Экран «Подключение»: ссылка-подписка + инструкция для выбранного приложения и платформы.
 *
 * Инструкция — общая с лендингом (`packages/shared-ui`): человек, дошедший до кабинета
 * после сайта, видит ровно те же шаги, а править их приходится в одном месте.
 */
import { reatomComponent } from '@reatom/react'
import { useEffect, useState } from 'react'
import { DownloadIcon, QrCodeIcon, RouterIcon } from 'lucide-react'
import QRCode from 'qrcode'
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

import { ApiError, fetchKeeneticConf } from '@/api/client.ts'
import { Button } from '@/components/ui/button.tsx'
import { cn } from '@/lib/utils.ts'
import { accessRes } from '@/state/cabinet.ts'
import { navigate } from '@/state/screen.ts'
import { Async, BRAND_ON, CopyValue, SECTION_CARD, SectionTitle } from '@/ui/components/common.tsx'

/** Ссылка длиннее этого режется многоточием: целиком она всё равно не читается. */
const URL_VISIBLE_LEN = 42

function shorten(url: string): string {
	return url.length > URL_VISIBLE_LEN ? `${url.slice(0, URL_VISIBLE_LEN)}…` : url
}

/** Ссылка-подписка: копирование одним тапом + QR для соседнего устройства. */
function SubscriptionLink({ url, backup }: { url: string; backup: string | null }) {
	const [qr, setQr] = useState<string | null>(null)
	const [showQr, setShowQr] = useState(false)

	useEffect(() => {
		if (!showQr) return
		let alive = true
		// width 320 = 2x от отображаемых 160px, чтобы не мылился на ретине
		QRCode.toDataURL(url, { margin: 1, width: 320 })
			.then((data) => alive && setQr(data))
			.catch(() => alive && setQr(null))
		return () => {
			alive = false
		}
	}, [showQr, url])

	return (
		<section className={SECTION_CARD}>
			<SectionTitle className="mb-3">Ваша ссылка-подписка</SectionTitle>
			<CopyValue
				value={url}
				className="w-full justify-between rounded-lg bg-muted px-3 py-2.5 font-mono text-sm"
			>
				<span className="truncate">{shorten(url)}</span>
			</CopyValue>

			<div className="mt-3 flex gap-2">
				<Button variant="outline" className="flex-1" onClick={() => setShowQr((v) => !v)}>
					<QrCodeIcon className="size-4" />
					{showQr ? 'Скрыть QR' : 'Показать QR'}
				</Button>
			</div>

			{showQr && qr && (
				<div className="mt-3 flex flex-col items-center gap-2">
					<img src={qr} alt="QR-код ссылки-подписки" className="size-40 rounded-lg bg-white p-2" />
					<p className="text-center text-xs text-muted-foreground">
						Отсканируйте с&nbsp;другого устройства — приложение добавит подписку само.
					</p>
				</div>
			)}

			{backup && (
				<div className="mt-4">
					<SectionTitle className="mb-1">Запасная ссылка</SectionTitle>
					<p className="mb-2 text-xs text-muted-foreground">
						Пригодится, если основная перестала открываться у&nbsp;вашего оператора.
					</p>
					<CopyValue
						value={backup}
						className="w-full justify-between rounded-lg bg-muted px-3 py-2 font-mono text-xs text-muted-foreground"
					>
						<span className="truncate">{shorten(backup)}</span>
					</CopyValue>
				</div>
			)}
		</section>
	)
}

/** Персональный конфиг для роутера — доступен на тарифах от 10 устройств. */
function RouterCard() {
	const [busy, setBusy] = useState(false)

	async function download() {
		setBusy(true)
		try {
			const conf = await fetchKeeneticConf()
			// Файл собираем на месте: скачивание идёт из-под подписи initData, и «просто
			// ссылку» на этот роут браузеру не отдать (заголовок он не пошлёт).
			const url = URL.createObjectURL(new Blob([conf], { type: 'text/plain' }))
			const a = document.createElement('a')
			a.href = url
			a.download = 'keenetic.conf'
			a.click()
			URL.revokeObjectURL(url)
			toast.success('Конфиг скачан')
		} catch (e) {
			toast.error(e instanceof ApiError ? e.message : 'Не удалось получить конфиг')
		} finally {
			setBusy(false)
		}
	}

	return (
		<section className={SECTION_CARD}>
			<SectionTitle className="mb-1">Роутер Keenetic</SectionTitle>
			<p className="mb-3 text-sm text-muted-foreground">
				Раздаёт доступ на&nbsp;всю домашнюю сеть — приложение на&nbsp;устройствах не&nbsp;нужно.
			</p>
			<Button variant="outline" className="w-full" disabled={busy} onClick={() => void download()}>
				<RouterIcon className="size-4" />
				{busy ? 'Готовим конфиг…' : 'Скачать keenetic.conf'}
			</Button>
		</section>
	)
}

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
								className="text-xs text-brand underline underline-offset-2"
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
