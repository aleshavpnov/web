/**
 * Аватар приглашённого друга.
 *
 * Картинку нельзя отдать тегу напрямую: гейт кабинета читает `Authorization: tma …`, а
 * `<img src>` заголовков не шлёт (см. fetchAvatar). Поэтому качаем сами и держим objectURL
 * в модульном кэше — один и тот же человек не должен дёргать Telegram при каждом открытии экрана.
 */
import { useEffect, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'

import { fetchAvatar } from '@/api/client.ts'
import { cn } from '@/lib/utils.ts'

/** Промис, а не готовый URL: два кружка одного tgId, смонтированные разом, качают один раз. */
const cache = new Map<string, Promise<string | null>>()

/** `full` — крупная версия для просмотра; кэшируется отдельно от миниатюры кружка. */
function loadAvatar(tgId: number, full = false): Promise<string | null> {
	const key = `${tgId}:${full ? 'full' : 'thumb'}`
	let pending = cache.get(key)
	if (!pending) {
		pending = fetchAvatar(tgId, full)
			.then((blob) => (blob ? URL.createObjectURL(blob) : null))
			.catch(() => null)
		cache.set(key, pending)
	}
	return pending
}

/**
 * Фото на весь экран. Сразу показывает уже скачанную миниатюру, а крупную подменяет, когда
 * доедет: пустой экран на время загрузки выглядел бы как поломка.
 *
 * Портал — потому что кружок живёт внутри строк списка, и `fixed` там может упереться
 * в чужой `overflow`/`transform`. Но React-события из портала всё равно всплывают по дереву
 * компонентов, поэтому клик по оверлею гасим сами — иначе закрытие открыло бы карточку строки.
 */
function AvatarViewer({
	tgId,
	thumb,
	label,
	onClose,
}: {
	tgId: number
	thumb: string
	label: string
	onClose: () => void
}) {
	const [src, setSrc] = useState(thumb)

	useEffect(() => {
		let alive = true
		void loadAvatar(tgId, true).then((value) => {
			if (alive && value) setSrc(value)
		})
		return () => {
			alive = false
		}
	}, [tgId])

	useEffect(() => {
		const onKey = (e: globalThis.KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		}
		document.addEventListener('keydown', onKey)
		return () => document.removeEventListener('keydown', onKey)
	}, [onClose])

	return createPortal(
		<div
			role="dialog"
			aria-modal="true"
			aria-label={label}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
			onClick={(e) => {
				e.stopPropagation()
				onClose()
			}}
		>
			<img
				src={src}
				alt={label}
				className="aspect-square max-h-[80vh] w-full max-w-[min(90vw,640px)] rounded-2xl object-contain"
			/>
		</div>,
		document.body,
	)
}

/**
 * Фон плейсхолдера. Цвет здесь чисто декоративный (смысл несут буквы), поэтому палитра
 * выбрана мягкой, а не статусной — иначе красный кружок читался бы как «что-то не так».
 */
const TINTS = [
	'bg-viz-series-1/15 text-viz-series-1',
	'bg-viz-series-2/15 text-viz-series-2',
	'bg-brand/15 text-brand',
	'bg-viz-warning/20 text-viz-warning',
] as const

function initials(label: string): string {
	const clean = label.replace(/^[@#]/, '').trim()
	if (!clean) return '?'
	const words = clean.split(/[\s._-]+/).filter(Boolean)
	const letters = words.length > 1 ? `${words[0]![0]}${words[1]![0]}` : clean.slice(0, 2)
	return letters.toUpperCase()
}

const SIZES = {
	sm: { box: 'size-9 text-[11px]' },
	md: { box: 'size-11 text-sm' },
} as const

export function Avatar({
	tgId,
	label,
	size = 'sm',
	className,
}: {
	tgId: number | null
	/** Что писать инициалами, пока (или если) фото нет: @username либо имя. */
	label: string
	size?: keyof typeof SIZES
	className?: string
}) {
	const [url, setUrl] = useState<string | null>(null)
	const [viewing, setViewing] = useState(false)

	useEffect(() => {
		if (tgId === null) return
		let alive = true
		void loadAvatar(tgId).then((value) => {
			if (alive) setUrl(value)
		})
		return () => {
			alive = false
		}
	}, [tgId])

	const { box } = SIZES[size]
	const tint = TINTS[Math.abs(tgId ?? 0) % TINTS.length]!

	// Строки списков сами кнопки: без stopPropagation тап по кружку заодно открыл бы карточку.
	const open = (e: MouseEvent | KeyboardEvent) => {
		e.stopPropagation()
		e.preventDefault()
		setViewing(true)
	}

	return (
		<span className={cn('relative shrink-0', className)}>
			{url ? (
				// Не `<button>`: кружок и так лежит внутри строк-кнопок, а вложенные кнопки невалидны.
				<span
					role="button"
					tabIndex={0}
					aria-label="Открыть фото"
					className="block cursor-zoom-in rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
					onClick={open}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') open(e)
					}}
				>
					<img
						src={url}
						alt=""
						className={cn(box, 'rounded-full object-cover ring-1 ring-foreground/10')}
					/>
				</span>
			) : (
				<span
					aria-hidden
					className={cn(box, tint, 'flex items-center justify-center rounded-full font-semibold')}
				>
					{initials(label)}
				</span>
			)}
			{viewing && url && tgId !== null && (
				<AvatarViewer tgId={tgId} thumb={url} label={label} onClose={() => setViewing(false)} />
			)}
		</span>
	)
}
