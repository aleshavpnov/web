/** Ресурсы экранов кабинета: по одному на каждый роут `/api/me`. */
import { atom } from '@reatom/core'

import {
	fetchAccess,
	fetchOverview,
	fetchPlans,
	fetchReferrals,
	fetchSettings,
	fetchSummary,
	fetchUsage,
	fetchWhatsnew,
} from '@/api/client.ts'
import { colorScheme, type ColorScheme } from '@/lib/telegram.ts'
import { resource } from './resource.ts'

export const themeAtom = atom<ColorScheme>(colorScheme(), 'theme')

export const overviewRes = resource('overview', fetchOverview)
export const accessRes = resource('access', fetchAccess)
export const plansRes = resource('plans', fetchPlans)
export const usageRes = resource('usage', fetchUsage)
export const referralsRes = resource('referrals', fetchReferrals)
export const summaryRes = resource('summary', fetchSummary)
export const whatsnewRes = resource('whatsnew', fetchWhatsnew)
export const settingsRes = resource('settings', fetchSettings)

/** Окно графика расхода, дни. 7 — как в админской карточке клиента. */
export const usageDaysAtom = atom(7, 'usageDays')
