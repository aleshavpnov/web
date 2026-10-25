/** Ресурсы экранов кабинета: по одному на каждый роут `/api/me`. */
import {
	fetchAccess,
	fetchOverview,
	fetchPlans,
	fetchReferrals,
	fetchSettings,
	fetchSummary,
	fetchUsage,
	fetchWhatsnew,
} from '#frontend/cabinet/api/client.ts'
import { atom } from '#frontend/lib/atom.ts'

import { resource } from './resource.ts'

export const overviewRes = resource(fetchOverview)
export const accessRes = resource(fetchAccess)
export const plansRes = resource(fetchPlans)
export const usageRes = resource(fetchUsage)
export const referralsRes = resource(fetchReferrals)
export const summaryRes = resource(fetchSummary)
export const whatsnewRes = resource(fetchWhatsnew)
export const settingsRes = resource(fetchSettings)

/** Окно графика расхода, дни. 7 — как в админской карточке клиента. */
export const usageDaysAtom = atom(7)
