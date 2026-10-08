/**
 * Список устройств с переименованием и удалением.
 *
 * «Забыть» убирает устройство из списка и из счётчика, но доступ не отзывает: ключ у всех
 * устройств общий, отдельного у них нет. Поэтому рядом стоит честная кнопка «Отключить
 * все устройства» — она перевыпускает и ссылку-подписку, и ключ, и это единственный способ
 * выгнать чужого.
 */
import { useState } from 'react'
import {
	AlertTriangleIcon,
	CheckIcon,
	PencilIcon,
	SmartphoneIcon,
	Trash2Icon,
	XIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { ApiError, forgetDevice, renameDevice, rotateAccess } from '@/api/client.ts'
import type { Device, DeviceGateMode } from '@/api/schemas.ts'
import { Button } from '@/components/ui/button.tsx'
import { formatAgo } from '@/lib/format.ts'
import { confirmAction, hapticError, hapticSuccess } from '@/lib/telegram.ts'
import { cn } from '@/lib/utils.ts'
import { navigate } from '@/state/screen.ts'
import { SECTION_CARD, SectionTitle } from './common.tsx'

/** Как подписать устройство: имя клиента → модель → честное «неизвестное». */
function deviceTitle(device: Device): string {
	return device.name ?? device.model ?? 'Неизвестное устройство'
}

function DeviceRow({
	device,
	gate,
	onChanged,
}: {
	device: Device
	gate: DeviceGateMode
	onChanged: () => void | Promise<void>
}) {
	const [editing, setEditing] = useState(false)
	const [draft, setDraft] = useState(device.name ?? '')
	const [busy, setBusy] = useState(false)

	async function save() {
		setBusy(true)
		try {
			await renameDevice(device.id, draft)
			hapticSuccess()
			setEditing(false)
			await onChanged()
		} catch (e) {
			hapticError()
			toast.error(e instanceof ApiError ? e.message : 'Не удалось сохранить имя')
		} finally {
			setBusy(false)
		}
	}

	async function forget() {
		// Спрашиваем: строка исчезает, и человек должен понимать, что именно произойдёт —
		// пока гейт не в enforce, доступ цел; в enforce освобождается слот.
		const ok = await confirmAction(
			gate === 'enforce'
				? `Убрать «${deviceTitle(device)}» и освободить слот? Устройство сможет обновить подписку, только если слот останется свободным.`
				: `Убрать «${deviceTitle(device)}» из списка? Доступ не отключится — устройство вернётся, если снова подключится.`,
		)
		if (!ok) return
		setBusy(true)
		try {
			await forgetDevice(device.id)
			hapticSuccess()
			await onChanged()
		} catch (e) {
			hapticError()
			toast.error(e instanceof ApiError ? e.message : 'Не удалось убрать устройство')
		} finally {
			setBusy(false)
		}
	}

	if (editing) {
		return (
			<li className="flex items-center gap-2 py-2">
				<input
					autoFocus
					value={draft}
					maxLength={40}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') void save()
						if (e.key === 'Escape') setEditing(false)
					}}
					placeholder={device.model ?? 'Название устройства'}
					className="min-h-11 min-w-0 flex-1 rounded-lg bg-muted px-3 text-sm outline-none ring-brand focus:ring-2"
				/>
				<Button size="icon-sm" variant="ghost" disabled={busy} onClick={() => void save()}>
					<CheckIcon className="size-4 text-brand" />
				</Button>
				<Button size="icon-sm" variant="ghost" onClick={() => setEditing(false)}>
					<XIcon className="size-4" />
				</Button>
			</li>
		)
	}

	return (
		<li className={cn('flex items-center gap-3 py-2', busy && 'opacity-60')}>
			<SmartphoneIcon className="size-4 shrink-0 text-muted-foreground" />
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<span className="truncate text-sm">{deviceTitle(device)}</span>
					{device.current && (
						<span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
							Это устройство
						</span>
					)}
				</div>
				<div className="truncate text-xs text-muted-foreground">
					{/* Когда имя своё, модель уходит в подпись — иначе непонятно, что это за железка. */}
					{[device.name ? device.model : null, device.os, formatAgo(device.lastSeen)]
						.filter(Boolean)
						.join(' · ')}
				</div>
				{device.returned && (
					<div className="text-xs text-viz-warning">
						Удаляли, но оно подключилось снова — ссылкой пользуется кто-то ещё
					</div>
				)}
			</div>
			<Button
				size="icon-sm"
				variant="ghost"
				disabled={busy}
				aria-label="Переименовать"
				onClick={() => {
					setDraft(device.name ?? '')
					setEditing(true)
				}}
			>
				<PencilIcon className="size-4 text-muted-foreground" />
			</Button>
			<Button
				size="icon-sm"
				variant="ghost"
				disabled={busy}
				aria-label="Убрать из списка"
				onClick={() => void forget()}
			>
				<Trash2Icon className="size-4 text-muted-foreground" />
			</Button>
		</li>
	)
}

export function DeviceList({
	devices,
	gate,
	suspended,
	onChanged,
}: {
	devices: Device[]
	/** Режим слотов устройств: в enforce «Забыть» освобождает слот по-настоящему. */
	gate: DeviceGateMode
	/** Доступ приостановлен за шеринг — перевыпуск ссылки не поможет, кнопку прячем. */
	suspended: boolean
	onChanged: () => void | Promise<void>
}) {
	const [rotating, setRotating] = useState(false)
	// Убранное устройство вернулось, значит мелкая подсказка не сработала.
	// Говорим прямо и выдвигаем перевыпуск вперёд.
	const intruder = devices.some((d) => d.returned)
	// Своё устройство сверху: его ищут первым, чтобы отличить от чужих.
	const sorted = [...devices].sort((a, b) => Number(b.current) - Number(a.current))

	async function rotate() {
		const ok = await confirmAction(
			'Выпустить новую ссылку и новый ключ? Все устройства, включая это, отключатся в течение нескольких минут. Свои подключите заново по новой ссылке.',
		)
		if (!ok) return
		setRotating(true)
		try {
			await rotateAccess()
			hapticSuccess()
			toast.success('Готово: старые ссылка и ключ отключены. Добавьте новую ссылку в приложение')
			await onChanged()
			// Новую ссылку человек берёт на экране подключения — ведём туда сразу.
			navigate('connect')
		} catch (e) {
			hapticError()
			toast.error(e instanceof ApiError ? e.message : 'Не удалось перевыпустить ссылку')
		} finally {
			setRotating(false)
		}
	}

	return (
		<section className={SECTION_CARD}>
			<SectionTitle>Устройства</SectionTitle>
			{devices.length === 0 ? (
				<p className="text-sm text-muted-foreground">За это окно подписку никто не&nbsp;забирал.</p>
			) : (
				<ul className="divide-y divide-border/60">
					{sorted.map((device) => (
						<DeviceRow key={device.id} device={device} gate={gate} onChanged={onChanged} />
					))}
				</ul>
			)}

			{!suspended && (
				<div className="mt-4 border-t border-border/60 pt-4">
					{intruder ? (
						<div className="mb-3 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
							<AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
							<span>
								Кто-то подключается по вашей ссылке. Выпустите новую — все устройства отключатся, а
								свои подключите заново.
							</span>
						</div>
					) : (
						<p className="mb-3 text-xs text-muted-foreground">
							{gate === 'enforce'
								? 'Удаление освобождает слот: устройство сможет обновить подписку, только если слот будет свободен. Чтобы отключить всех разом — выпустите новую ссылку.'
								: 'Удаление из списка не отключает устройство: ссылка-подписка общая. Чтобы отключить всех разом — выпустите новую.'}
						</p>
					)}
					<Button
						variant={intruder ? 'default' : 'outline'}
						className="w-full"
						disabled={rotating}
						onClick={() => void rotate()}
					>
						{rotating ? 'Выпускаем…' : 'Отключить все устройства'}
					</Button>
				</div>
			)}
		</section>
	)
}
