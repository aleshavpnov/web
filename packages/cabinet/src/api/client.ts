/**
 * HTTP-клиент кабинета. Каждый запрос несёт `Authorization: tma <initData>` — бот проверяет
 * подпись Telegram на каждом вызове, поэтому ни сессий, ни cookie здесь нет.
 *
 * Кто спрашивает — бот берёт из подписи, не из параметров: своего tgId клиент никуда не
 * передаёт, и передать чужой не может.
 *
 * 404 от гейта неотличим от «нет такого роута» намеренно (см. tma-auth.ts на боте).
 */
import { z } from 'zod'

import { initData } from '@/lib/telegram.ts'
import {
	AccessSchema,
	AdviceSchema,
	BotHandoffSchema,
	CheckoutSchema,
	OverviewSchema,
	PlansSchema,
	ReferralsSchema,
	SettingsSchema,
	SummarySchema,
	UsageSchema,
	WhatsnewSchema,
	type Access,
	type Advice,
	type Audience,
	type BotHandoff,
	type CabinetEvent,
	type DeviceNeed,
	type Overview,
	type Plans,
	type Referrals,
	type SettingKey,
	type Settings,
	type Summary,
	type Usage,
	type Whatsnew,
} from './schemas.ts'

const BASE = `${(import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')}/api/me`

/** Ошибка с текстом от сервера — экран показывает её как есть. */
export class ApiError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message)
		this.name = 'ApiError'
	}
}

// Пояс устройства. Едет заголовком x-tz с каждым запросом: бот запоминает его
// per-user и показывает даты подписки в этом поясе, а не в своём серверном.
function deviceTimezone(): string | undefined {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined
	} catch {
		return undefined
	}
}

async function request<T>(
	path: string,
	schema: { parse: (v: unknown) => T },
	init?: { method: 'POST'; body?: unknown },
): Promise<T> {
	const tz = deviceTimezone()
	const res = await fetch(`${BASE}${path}`, {
		method: init?.method ?? 'GET',
		headers: {
			accept: 'application/json',
			authorization: `tma ${initData()}`,
			...(tz === undefined ? {} : { 'x-tz': tz }),
			...(init?.body === undefined ? {} : { 'content-type': 'application/json' }),
		},
		body: init?.body === undefined ? undefined : JSON.stringify(init.body),
	})

	if (!res.ok) {
		const detail = await res
			.json()
			.then((b: unknown) => (b as { error?: string })?.error)
			.catch(() => undefined)
		throw new ApiError(detail ?? `Запрос не прошёл (${res.status})`, res.status)
	}
	return schema.parse(await res.json())
}

export const fetchOverview = (): Promise<Overview> => request('/overview', OverviewSchema)

/** 409 — действующей подписки нет: экран «Подключение» покажет это состоянием, не ошибкой. */
export const fetchAccess = (): Promise<Access> => request('/access', AccessSchema)

export const fetchPlans = (): Promise<Plans> => request('/plans', PlansSchema)

export const fetchUsage = (days: number): Promise<Usage> =>
	request(`/usage?days=${days}`, UsageSchema)

/** Подбор тарифа по ответам визарда: правило живёт на боте, фронт только спрашивает. */
export const fetchAdvice = (need: DeviceNeed, audience: Audience): Promise<Advice> =>
	request(`/advice?need=${need}&audience=${audience}`, AdviceSchema)

/**
 * Шаг воронки. Ошибки глотаем: аналитика не должна ломать покупку — если событие не
 * записалось, человек всё равно обязан дойти до оплаты.
 */
export function trackEvent(name: CabinetEvent, value?: string): void {
	void request('/events', z.object({ ok: z.boolean() }), {
		method: 'POST',
		body: value === undefined ? { name } : { name, value },
	}).catch(() => {})
}

/**
 * Чем платить, кроме подписки Tribute: код способа разовой оплаты Platega или
 * `'sbp_sub'` — автопродление по СБП.
 */
export type PaymentChoice = number | 'sbp_sub'

/**
 * Фиксирует намерение и отдаёт ссылку оплаты. Какую именно — решает бот: подписку Tribute,
 * подарочный товар, свежесозданную форму разовой оплаты или привязку счёта
 * для СБП-подписки.
 */
export const startCheckout = (
	planCode: string,
	audience: Audience,
	choice?: PaymentChoice,
): Promise<{ buyUrl: string; provider: 'tribute' | 'platega' | 'platega_sub' }> =>
	request('/checkout', CheckoutSchema, {
		method: 'POST',
		body:
			choice === undefined
				? { planCode, audience }
				: choice === 'sbp_sub'
					? { planCode, audience, provider: 'platega_sub' }
					: { planCode, audience, provider: 'platega', method: choice },
	})

/** Отключить автопродление по СБП. Возвращает, до какого момента остаётся доступ. */
export const cancelSbpSubscription = (): Promise<{ accessUntil: string | null }> =>
	request(
		'/platega-subscription/cancel',
		z.object({ ok: z.boolean(), accessUntil: z.string().nullable() }),
		{ method: 'POST', body: {} },
	)

/**
 * Аватар приглашённого. Не `<img src>`: гейт кабинета читает только заголовок
 * `Authorization`, а тег картинки его не шлёт — поэтому качаем сами и отдаём Blob.
 * `null` — фото нет (204), приватность закрыта или бот не достучался до Telegram.
 */
export async function fetchAvatar(tgId: number): Promise<Blob | null> {
	const res = await fetch(`${BASE}/avatars/${tgId}`, {
		headers: { authorization: `tma ${initData()}` },
	})
	if (res.status === 204 || !res.ok) return null
	return res.blob()
}

/** Своё имя устройству; пустая строка снимает имя и возвращает модель. */
export const renameDevice = (id: string, name: string): Promise<{ ok: boolean }> =>
	request(`/devices/${id}/name`, z.object({ ok: z.boolean() }), {
		method: 'POST',
		body: { name },
	})

/** Убирает устройство из списка. Доступ не отзывает — для этого есть перевыпуск ссылки. */
export const forgetDevice = (id: string): Promise<{ ok: boolean }> =>
	request(`/devices/${id}/forget`, z.object({ ok: z.boolean() }), { method: 'POST' })

/** Новая ссылка-подписка: старая умирает, все устройства отваливаются. */
export const rotateAccess = (): Promise<Access> =>
	request('/access/rotate', AccessSchema, {
		method: 'POST',
	})

/** Плитки главной: расход, устройства и приглашённые одним запросом. */
export const fetchSummary = (): Promise<Summary> => request('/summary', SummarySchema)

export const fetchReferrals = (): Promise<Referrals> => request('/referrals', ReferralsSchema)

export const fetchWhatsnew = (): Promise<Whatsnew> => request('/whatsnew', WhatsnewSchema)

export const fetchSettings = (): Promise<Settings> => request('/settings', SettingsSchema)

export const setSetting = (key: SettingKey, on: boolean): Promise<Settings> =>
	request('/settings', SettingsSchema, { method: 'POST', body: { key, on } })

/** Включает режим переписки в боте; дальше диалог идёт в чате, кабинет закрывается. */
export const openSupport = (): Promise<BotHandoff> =>
	request('/support/open', BotHandoffSchema, { method: 'POST' })

/**
 * Просит бота прислать `keenetic.conf` документом в чат. Самим файлом ответ не приходит:
 * скачать его из вебвью Mini App всё равно нельзя (см. RouterCard).
 */
export const sendKeeneticConf = (): Promise<BotHandoff> =>
	request('/keenetic/config', BotHandoffSchema, { method: 'POST' })
