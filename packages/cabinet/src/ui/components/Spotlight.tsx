/**
 * Подсветка одной кнопки на затемнённом экране — финал диплинка из подсказки бота.
 *
 * Прокрутки к нужной карточке оказалось мало: экран длинный, кнопка мелкая, и человек
 * всё равно не понимал, куда жать (разбор 28.08.2026). Поэтому гасим всё вокруг и
 * оставляем светящуюся цель с запиской рядом.
 *
 * Вырез сделан гигантской тенью (`box-shadow: 0 0 0 9999px`), а не маской с дыркой:
 * так затемнение и «окно» — один элемент, который не надо синхронизировать, а сама
 * кнопка остаётся настоящей и кликается насквозь (`pointer-events: none` на слое).
 */
import { useEffect, useState } from 'react'

import type { SpotlightTarget } from '@shared/connect/index.ts'

/** Отступ выреза от кнопки — чтобы свечение не липло к её краю. */
const PAD = 8

interface Rect {
	top: number
	left: number
	width: number
	height: number
}

function rectOf(el: Element): Rect {
	const r = el.getBoundingClientRect()
	return {
		top: r.top - PAD,
		left: r.left - PAD,
		width: r.width + PAD * 2,
		height: r.height + PAD * 2,
	}
}

/**
 * Ждёт появления цели в DOM: экран рисуется после ответа `/access`, а диплинк открывается
 * сразу. Наблюдатель дешевле опроса и снимается вместе с эффектом.
 */
function useTarget(target: SpotlightTarget | null): Element | null {
	const [el, setEl] = useState<Element | null>(null)

	useEffect(() => {
		if (!target) return setEl(null)
		const find = () => document.querySelector(`[data-spotlight="${target}"]`)
		const found = find()
		if (found) {
			setEl(found)
			return
		}
		const mo = new MutationObserver(() => {
			const late = find()
			if (late) {
				setEl(late)
				mo.disconnect()
			}
		})
		mo.observe(document.body, { childList: true, subtree: true })
		return () => mo.disconnect()
	}, [target])

	return el
}

/**
 * Затемнение с вырезом вокруг цели и запиской рядом.
 *
 * Гасится по любому касанию, Escape и уходу с экрана: подсказка разовая, держать её
 * поверх интерфейса дольше первого взгляда — только мешать.
 */
export function Spotlight({
	target,
	note,
	onDone,
}: {
	target: SpotlightTarget | null
	note: string
	onDone: () => void
}) {
	const el = useTarget(target)
	const [rect, setRect] = useState<Rect | null>(null)

	// Позиция цели: считаем после скролла к ней и держим в актуальном состоянии, пока
	// экран елозит (мягкая прокрутка, догрузка карточек, поворот телефона).
	useEffect(() => {
		if (!el) return
		el.scrollIntoView({ behavior: 'smooth', block: 'center' })
		const sync = () => setRect(rectOf(el))
		const raf = requestAnimationFrame(sync)
		const timer = setInterval(sync, 100)
		window.addEventListener('resize', sync)
		return () => {
			cancelAnimationFrame(raf)
			clearInterval(timer)
			window.removeEventListener('resize', sync)
		}
	}, [el])

	useEffect(() => {
		if (!el) return
		const stop = () => onDone()
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') stop()
		}
		document.addEventListener('keydown', onKey)
		return () => document.removeEventListener('keydown', onKey)
	}, [el, onDone])

	if (!el || !rect) return null

	// Записка снизу, если сверху не помещается: у кнопки маршрутов над ней шапка экрана.
	const below = rect.top < 120

	return (
		<div className="pointer-events-none fixed inset-0 z-50" aria-hidden>
			{/*
			 * Ловушка тапа — четырьмя полосами ВОКРУГ цели, а не одним слоем поверх всего:
			 * сплошной слой перехватывал бы и нажатие на саму подсвеченную кнопку, то есть
			 * гасил подсказку вместо того, ради чего человек сюда пришёл.
			 */}
			{[
				{ top: 0, left: 0, width: '100%', height: Math.max(0, rect.top) },
				{ top: rect.top + rect.height, left: 0, width: '100%', bottom: 0 },
				{ top: rect.top, left: 0, width: Math.max(0, rect.left), height: rect.height },
				{ top: rect.top, left: rect.left + rect.width, right: 0, height: rect.height },
			].map((style, i) => (
				<button
					key={i}
					type="button"
					aria-label="Скрыть подсказку"
					className="pointer-events-auto absolute cursor-default bg-transparent"
					style={style}
					onClick={onDone}
				/>
			))}

			<div
				className="absolute rounded-xl ring-2 ring-brand"
				style={{
					top: rect.top,
					left: rect.left,
					width: rect.width,
					height: rect.height,
					// Одной строкой: свечение вокруг цели и заливка всего остального экрана.
					boxShadow: '0 0 24px 6px rgba(16, 185, 129, 0.45), 0 0 0 9999px rgba(0, 0, 0, 0.5)',
				}}
			/>

			<div
				// Плашка темнее фирменного зелёного: белый текст на самом brand почти не читается.
				className="absolute max-w-[15rem] rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white shadow-xl"
				style={{
					top: below ? rect.top + rect.height + 12 : undefined,
					bottom: below ? undefined : window.innerHeight - rect.top + 12,
					left: Math.max(12, Math.min(rect.left, window.innerWidth - 252)),
				}}
			>
				{note}
			</div>
		</div>
	)
}
