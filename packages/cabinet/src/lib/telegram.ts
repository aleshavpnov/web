/**
 * Тонкая обёртка над Telegram Mini App SDK (`telegram-web-app.js`, подключён в index.html).
 *
 * Всё, что знает про `window.Telegram`, живёт здесь: остальному приложению видны только
 * обычные функции, поэтому в браузере (дев-режим) и в вебвью Telegram код одинаков.
 * Типы объявлены вручную — тянуть пакет типов ради пяти полей незачем.
 */

interface TelegramWebApp {
	initData: string
	colorScheme: 'light' | 'dark'
	ready(): void
	expand(): void
	close(): void
	openLink(url: string, options?: { try_instant_view?: boolean }): void
	openTelegramLink(url: string): void
	onEvent(event: 'themeChanged', handler: () => void): void
	offEvent(event: 'themeChanged', handler: () => void): void
	showConfirm?(message: string, callback: (confirmed: boolean) => void): void
	BackButton?: {
		show(): void
		hide(): void
		onClick(handler: () => void): void
		offClick(handler: () => void): void
	}
	HapticFeedback?: {
		notificationOccurred(type: 'error' | 'success' | 'warning'): void
	}
}

declare global {
	interface Window {
		Telegram?: { WebApp?: TelegramWebApp }
	}
}

function app(): TelegramWebApp | null {
	return window.Telegram?.WebApp ?? null
}

/** Открыто ли приложение внутри Telegram (а не просто в браузере). */
export function insideTelegram(): boolean {
	return Boolean(app()?.initData)
}

/**
 * Подписанная Telegram строка для заголовка `Authorization: tma <...>`.
 * Пустая — в браузере; тогда единственный способ пройти гейт — дев-обход на боте.
 */
export function initData(): string {
	return app()?.initData ?? ''
}

/** Готовность к показу + разворачивание на всю высоту. Безопасно вне Telegram. */
export function initMiniApp(): void {
	const tg = app()
	tg?.ready()
	tg?.expand()
}

export type ColorScheme = 'light' | 'dark'

/**
 * Тему спрашиваем у Telegram только когда мы действительно внутри него. Скрипт SDK
 * подгружается на страницу всегда, и в обычном браузере он рапортует `colorScheme: 'light'`
 * независимо от системной темы — из-за этого дев-режим всегда открывался светлым.
 */
export function colorScheme(): ColorScheme {
	const tg = app()
	if (tg && insideTelegram()) return tg.colorScheme
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Подписка на смену темы; возвращает отписку. Вне Telegram следит за системной темой. */
export function onColorSchemeChange(handler: () => void): () => void {
	const tg = app()
	if (tg && insideTelegram()) {
		tg.onEvent('themeChanged', handler)
		return () => tg.offEvent('themeChanged', handler)
	}
	const mq = window.matchMedia('(prefers-color-scheme: dark)')
	mq.addEventListener('change', handler)
	return () => mq.removeEventListener('change', handler)
}

/**
 * Подтверждение необратимого действия. В Telegram — нативный диалог, в браузере —
 * `window.confirm`: одна точка вызова вместо двух путей в каждом обработчике.
 */
export function confirmAction(message: string): Promise<boolean> {
	const tg = app()
	// Проверяем insideTelegram, а не только наличие метода: SDK подключён на страницу
	// всегда, и в обычном браузере showConfirm существует, но не отвечает — промис
	// повисал бы навсегда, и кнопка молча ничего не делала (ловилось только в деве).
	if (tg && insideTelegram() && tg.showConfirm) {
		return new Promise((resolve) => tg.showConfirm!(message, resolve))
	}
	return Promise.resolve(window.confirm(message))
}

/**
 * Открыть ссылку наружу. `t.me/*` уходит через `openTelegramLink` — иначе Telegram
 * откроет её во внешнем браузере и покупка в Tribute (тоже Mini App) не начнётся.
 * Вне Telegram — обычная вкладка.
 */
export function openLink(url: string): void {
	const tg = app()
	if (!tg || !insideTelegram()) {
		window.open(url, '_blank', 'noopener,noreferrer')
		return
	}
	if (url.startsWith('https://t.me/')) tg.openTelegramLink(url)
	else tg.openLink(url)
}

/** Закрыть Mini App — например, когда дальше диалог идёт в чате с ботом. */
export function closeMiniApp(): void {
	app()?.close()
}

/** Отклик на неудачу — в Telegram тактильный, в браузере ничего. */
export function hapticError(): void {
	app()?.HapticFeedback?.notificationOccurred('error')
}

/** Отклик на успех: копирование по клику иначе никак не подтверждается пальцу. */
export function hapticSuccess(): void {
	app()?.HapticFeedback?.notificationOccurred('success')
}

/**
 * Кнопка «назад» в шапке Telegram. `handler === null` прячет её.
 * Возвращает отписку — вызывать при размонтировании экрана.
 */
export function setBackButton(handler: (() => void) | null): () => void {
	const back = app()?.BackButton
	if (!back) return () => {}
	if (!handler) {
		back.hide()
		return () => {}
	}
	back.onClick(handler)
	back.show()
	return () => {
		back.offClick(handler)
		back.hide()
	}
}
