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
	CheckoutSchema,
	OverviewSchema,
	PlansSchema,
	ReferralsSchema,
	SettingsSchema,
	SummarySchema,
	SupportOpenSchema,
	UsageSchema,
	WhatsnewSchema,
	type Access,
	type Advice,
	type Audience,
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

async function request<T>(
	path: string,
	schema: { parse: (v: unknown) => T },
	init?: { method: 'POST'; body?: unknown },
): Promise<T> {
	const res = await fetch(`${BASE}${path}`, {
		method: init?.method ?? 'GET',
		headers: {
			accept: 'application/json',
			authorization: `tma ${initData()}`,
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

/** Фиксирует намерение и отдаёт ссылку оплаты (обычную или подарочную — решает бот). */
export const startCheckout = (planCode: string, audience: Audience): Promise<{ buyUrl: string }> =>
	request('/checkout', CheckoutSchema, { method: 'POST', body: { planCode, audience } })

/** Плитки главной: расход, устройства и приглашённые одним запросом. */
export const fetchSummary = (): Promise<Summary> => request('/summary', SummarySchema)

export const fetchReferrals = (): Promise<Referrals> => request('/referrals', ReferralsSchema)

export const fetchWhatsnew = (): Promise<Whatsnew> => request('/whatsnew', WhatsnewSchema)

export const fetchSettings = (): Promise<Settings> => request('/settings', SettingsSchema)

export const setSetting = (key: SettingKey, on: boolean): Promise<Settings> =>
	request('/settings', SettingsSchema, { method: 'POST', body: { key, on } })

/** Включает режим переписки в боте; дальше диалог идёт в чате, кабинет закрывается. */
export const openSupport = (): Promise<{ ok: boolean; botLink: string }> =>
	request('/support/open', SupportOpenSchema, { method: 'POST' })

/**
 * Конфиг роутера. Не JSON: бот отдаёт готовый файл `keenetic.conf`, и скачивать его
 * фронт должен как текст — поэтому мимо `request`.
 */
export async function fetchKeeneticConf(): Promise<string> {
	const res = await fetch(`${BASE}/keenetic/config`, {
		method: 'POST',
		headers: { authorization: `tma ${initData()}` },
	})
	if (!res.ok) {
		const detail = await res
			.json()
			.then((b: unknown) => (b as { error?: string })?.error)
			.catch(() => undefined)
		throw new ApiError(detail ?? `Запрос не прошёл (${res.status})`, res.status)
	}
	return res.text()
}
