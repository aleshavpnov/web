/**
 * Аватар приглашённого друга.
 *
 * Картинку нельзя отдать тегу напрямую: гейт кабинета читает `Authorization: tma …`, а
 * `<img src>` заголовков не шлёт (см. fetchAvatar). Поэтому качаем сами и держим objectURL
 * в модульном кэше — один и тот же человек не должен дёргать Telegram при каждом открытии экрана.
 */
import { useEffect, useState } from 'react'

import { fetchAvatar } from '@/api/client.ts'
import { cn } from '@/lib/utils.ts'

/** Промис, а не готовый URL: два кружка одного tgId, смонтированные разом, качают один раз. */
const cache = new Map<number, Promise<string | null>>()

function loadAvatar(tgId: number): Promise<string | null> {
	let pending = cache.get(tgId)
	if (!pending) {
		pending = fetchAvatar(tgId)
			.then((blob) => (blob ? URL.createObjectURL(blob) : null))
			.catch(() => null)
		cache.set(tgId, pending)
	}
	return pending
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

	return (
		<span className={cn('relative shrink-0', className)}>
			{url ? (
				<img
					src={url}
					alt=""
					className={cn(box, 'rounded-full object-cover ring-1 ring-foreground/10')}
				/>
			) : (
				<span
					aria-hidden
					className={cn(box, tint, 'flex items-center justify-center rounded-full font-semibold')}
				>
					{initials(label)}
				</span>
			)}
		</span>
	)
}
