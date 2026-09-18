/**
 * Полоска фонового обновления во всю ширину экрана.
 *
 * Единственная на приложение: экран во время рефетча остаётся живым и кликабельным
 * (см. Async), и сказать «сейчас обновится» нужно один раз сверху, а не гасить
 * каждый блок по отдельности.
 */
import { reatomComponent } from '@reatom/react'
import { useEffect, useState } from 'react'

import { anyLoadingAtom } from '@/state/resource.ts'

/**
 * Сколько ждать, прежде чем показать полоску. Ответы /api/me обычно быстрее, а переход
 * между вкладками перезапрашивает экран каждый раз — без задержки полоска моргала бы
 * на ровном месте.
 */
const APPEAR_DELAY_MS = 200

export const LoadingBar = reatomComponent(() => {
	const loading = anyLoadingAtom()
	const [visible, setVisible] = useState(false)

	useEffect(() => {
		if (!loading) {
			setVisible(false)
			return
		}
		const timer = setTimeout(() => setVisible(true), APPEAR_DELAY_MS)
		return () => clearTimeout(timer)
	}, [loading])

	if (!visible) return null

	return (
		<div
			aria-hidden
			className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden"
		>
			<div className="loading-slide h-full w-1/3 bg-brand" />
		</div>
	)
}, 'LoadingBar')
