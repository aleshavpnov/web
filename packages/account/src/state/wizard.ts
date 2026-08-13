/**
 * Состояние подбора тарифа.
 *
 * Живёт в сторе, а не внутри компонента, потому что шагами управляет не только сам визард:
 * назад по ним ходят и стрелка в шапке экрана, и системная кнопка Telegram. Держать шаг
 * в useState значило бы дублировать логику возврата в трёх местах.
 */
import { action, atom } from '@reatom/core'

import type { Advice, Audience, DeviceNeed } from '@/api/schemas.ts'

export type WizardStep = 'audience' | 'devices' | 'result'

export const WIZARD_STEPS: readonly WizardStep[] = ['audience', 'devices', 'result']

export const stepAtom = atom<WizardStep>('audience', 'wizardStep')
export const audienceAtom = atom<Audience | null>(null, 'wizardAudience')
export const needAtom = atom<DeviceNeed | null>(null, 'wizardNeed')
export const adviceAtom = atom<Advice | null>(null, 'wizardAdvice')

/** Есть ли куда возвращаться внутри визарда — по этому же признаку рисуется стрелка. */
export function canGoBack(step: WizardStep): boolean {
	return step !== 'audience'
}

/**
 * Шаг назад. `false` — визард уже на первом шаге, и назад должен вести кто-то другой
 * (шапка уводит на главную).
 */
export const wizardBack = action((): boolean => {
	const step = stepAtom()
	if (step === 'result') {
		stepAtom.set('devices')
		// Рекомендацию сбрасываем: на шаге устройств она уже не про то, что выбрано,
		// и мелькнёт устаревшей при следующем переходе вперёд.
		adviceAtom.set(null)
		return true
	}
	if (step === 'devices') {
		stepAtom.set('audience')
		return true
	}
	return false
}, 'wizardBack')

/** Начать подбор заново — с первого вопроса и без прежних ответов. */
export const wizardReset = action(() => {
	stepAtom.set('audience')
	audienceAtom.set(null)
	needAtom.set(null)
	adviceAtom.set(null)
}, 'wizardReset')
