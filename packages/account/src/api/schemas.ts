/**
 * Схемы ответов `/api/me`. Валидация на входе — договор с ботом в одном месте:
 * разъехавшееся поле видно сразу и по имени, а не «undefined is not an object» в вёрстке.
 */
import { z } from 'zod'

export const SubSchema = z.object({
	planCode: z.string(),
	planName: z.string(),
	planEmoji: z.string(),
	status: z.enum(['active', 'cancelled', 'pending', 'expired']),
	type: z.string(),
	expiresAt: z.string(),
	/** Дата следующего списания Tribute; расходится с expiresAt на бонусные дни. */
	tributeExpiresAt: z.string().nullable(),
	deviceLimit: z.number().nullable(),
	tributeWebAppLink: z.string().nullable(),
})

export const OverviewSchema = z.object({
	kind: z.enum(['paid', 'vip', 'none']),
	sub: SubSchema.nullable(),
	vip: z.object({ expiresAt: z.string().nullable() }).nullable(),
	trial: z.object({ available: z.boolean(), days: z.number() }),
	pendingGifts: z.number(),
	support: z.object({ available: z.boolean() }),
	/** t.me-ссылка на веб-админку; null — обычному клиенту её не показываем. */
	adminMiniAppUrl: z.string().nullable(),
	botUsername: z.string(),
})

export const AccessSchema = z.object({
	subscriptionUrl: z.string(),
	subscriptionUrlBackup: z.string().nullable(),
	vlessUrl: z.string(),
	canUseRouter: z.boolean(),
})

/** Тариф без ссылки оплаты: витрина отдаёт её отдельно, подбор — в своём ответе. */
const PlanBaseSchema = z.object({
	code: z.string(),
	name: z.string(),
	emoji: z.string(),
	priceLabel: z.string(),
	deviceLimit: z.number(),
	durationDays: z.number(),
})

const PlanSchema = PlanBaseSchema.extend({ buyUrl: z.string() })

export const PlansSchema = z.object({
	plans: z.array(PlanSchema),
	gifts: z.array(PlanSchema),
	current: z.object({ planCode: z.string(), planName: z.string() }).nullable(),
	pendingGifts: z.array(z.object({ planName: z.string(), deepLink: z.string() })),
	manageUrl: z.string().nullable(),
})

export const UsageSchema = z.object({
	/** false — учёта нет (VIP-метка или подписки не было): график рисовать нечего. */
	available: z.boolean(),
	windowDays: z.number(),
	usedBytes: z.number(),
	usedUp: z.number(),
	usedDown: z.number(),
	series: z.array(
		z.object({ bucket: z.string(), bytes: z.number(), up: z.number(), down: z.number() }),
	),
	granularity: z.enum(['hour', 'day']),
	historyDays: z.number(),
	avgPerDayBytes: z.number(),
	hysteriaBytes: z.number(),
	deviceLimit: z.number().nullable(),
	devices: z.array(
		z.object({
			/** Публичный хеш устройства — им адресуем переименование и удаление. */
			id: z.string(),
			/** Имя, данное клиентом; null — показываем модель. */
			name: z.string().nullable(),
			model: z.string().nullable(),
			os: z.string().nullable(),
			lastSeen: z.string(),
		}),
	),
})

export type Device = z.infer<typeof UsageSchema>['devices'][number]

export const AdviceSchema = z.object({
	/** null — продавать нечего: для этой аудитории не настроено ни одной ссылки оплаты. */
	plan: PlanBaseSchema.nullable(),
	buyUrl: z.string().nullable(),
})

export const CheckoutSchema = z.object({ buyUrl: z.string() })

export const SummarySchema = z.object({
	windowDays: z.number(),
	/** null — доступа нет: плитка скажет «нет данных», а не нарисует ноль. */
	usedBytes: z.number().nullable(),
	devices: z.number().nullable(),
	deviceLimit: z.number().nullable(),
	referrals: z.object({ joined: z.number(), paid: z.number() }),
})

export const ReferralsSchema = z.object({
	code: z.string(),
	link: z.string(),
	/** Ссылка на whitelist-достижимом зеркале; null — SUB_BACKUP_DOMAIN не настроен. */
	linkBackup: z.string().nullable(),
	rewardDays: z.number(),
	clicks: z.number(),
	joined: z.number(),
	paid: z.number(),
	invited: z.array(z.object({ tgId: z.number(), label: z.string(), rewarded: z.boolean() })),
})

export const WhatsnewSchema = z.object({
	items: z.array(z.object({ version: z.string(), date: z.string(), body: z.string() })),
})

export const SettingsSchema = z.object({
	notify: z.boolean(),
	news: z.boolean(),
	broadcast: z.boolean(),
})

export const SupportOpenSchema = z.object({ ok: z.boolean(), botLink: z.string() })

/**
 * События воронки. Список повторяет белый список бота (`CABINET_EVENTS` в cabinet-api.ts):
 * чужое имя он не примет, и молчаливо потерять шаг из-за опечатки нельзя.
 */
export type CabinetEvent =
	| 'wizard_open'
	| 'wizard_audience'
	| 'wizard_devices'
	| 'wizard_result'
	| 'wizard_checkout'
	| 'plans_list_open'

/** Ответ на шаг «сколько устройств» — тот же словарь, что понимает бот. */
export type DeviceNeed = 'one' | 'few' | 'family'
/** Ответ на шаг «кому». */
export type Audience = 'self' | 'gift'

export type Sub = z.infer<typeof SubSchema>
export type Overview = z.infer<typeof OverviewSchema>
export type Access = z.infer<typeof AccessSchema>
export type Plan = z.infer<typeof PlanSchema>
export type Plans = z.infer<typeof PlansSchema>
export type Advice = z.infer<typeof AdviceSchema>
export type Usage = z.infer<typeof UsageSchema>
export type Summary = z.infer<typeof SummarySchema>
export type Referrals = z.infer<typeof ReferralsSchema>
export type Whatsnew = z.infer<typeof WhatsnewSchema>
export type Settings = z.infer<typeof SettingsSchema>
export type SettingKey = keyof Settings
