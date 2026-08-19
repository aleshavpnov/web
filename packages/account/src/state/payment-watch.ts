/**
 * Ожидание оплаты после ухода на форму провайдера.
 *
 * Кабинет живёт в вебвью Telegram и остаётся открытым, пока человек платит в другом окне.
 * Возвращаясь, он видел ТОТ ЖЕ экран визарда: подписка уже оплачена, доступ выдан, а в
 * кабинете ничего не изменилось (жалоба 19.08.2026). Поэтому после ухода на оплату
 * кабинет сам следит за подпиской: опрашивает `/api/me/overview` и вдобавок проверяет
 * состояние, когда вебвью снова получает фокус — обычно результат виден именно тогда.
 *
 * Признак оплаты — смена «отпечатка» доступа (вид доступа + дата окончания): он меняется
 * и при первой покупке, и при продлении уже активной подписки.
 */
import { overviewRes, plansRes, accessRes } from './cabinet.ts'
import type { Overview } from '@/api/schemas.ts'

/** Как часто спрашивать бота, пока ждём подтверждения. */
const POLL_INTERVAL_MS = 4000

/**
 * Сколько всего ждать. Платёж подтверждается за секунды, но человек может задержаться на
 * форме банка; после этого срока опрос прекращается — «висящий» таймер в вебвью, которое
 * держат открытым часами, никому не нужен.
 */
const POLL_TIMEOUT_MS = 5 * 60_000

/** Что считаем изменением: вид доступа и до какого числа он действует. */
function fingerprint(overview: Overview | null): string {
	if (!overview) return ''
	return `${overview.kind}:${overview.sub?.expiresAt ?? ''}:${overview.vip?.expiresAt ?? ''}`
}

let stop: (() => void) | null = null

/** Остановить наблюдение (вызывается само по успеху и по таймауту). */
export function stopPaymentWatch(): void {
	stop?.()
	stop = null
}

/**
 * Начать ждать оплату. `onPaid` вызывается один раз, когда доступ изменился; данные
 * витрины и подключения к этому моменту уже перезагружены.
 */
export function watchPayment(onPaid: () => void): void {
	stopPaymentWatch()

	// База сравнения. Пусто (экран открыли до первой загрузки, или запрос не прошёл) —
	// базой станет ПЕРВЫЙ успешный ответ: иначе появление данных из ниоткуда было бы
	// неотличимо от оплаты, и кабинет радостно поздравлял бы с несуществующей покупкой.
	let before = fingerprint(overviewRes.dataAtom()) || null
	const startedAt = Date.now()

	const check = async (): Promise<void> => {
		await overviewRes.load()
		const now = fingerprint(overviewRes.dataAtom())
		if (!now) return
		if (before === null) {
			before = now
			return
		}
		if (now === before) return
		stopPaymentWatch()
		// Соседние экраны (подключение, витрина) держат свои копии данных — без обновления
		// человек ушёл бы с главной на «Доступ» и увидел там прежнее состояние.
		void accessRes.load()
		void plansRes.load()
		onPaid()
	}

	const timer = setInterval(() => {
		if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
			stopPaymentWatch()
			return
		}
		void check()
	}, POLL_INTERVAL_MS)

	// Возврат в вебвью — самый вероятный момент, когда оплата уже прошла: проверяем сразу,
	// не дожидаясь следующего тика.
	const onVisible = (): void => {
		if (document.visibilityState === 'visible') void check()
	}
	document.addEventListener('visibilitychange', onVisible)
	window.addEventListener('focus', onVisible)

	stop = () => {
		clearInterval(timer)
		document.removeEventListener('visibilitychange', onVisible)
		window.removeEventListener('focus', onVisible)
	}
}
