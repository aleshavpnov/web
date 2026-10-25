/**
 * Асинхронный ресурс: данные, флаг загрузки и текст ошибки одним набором атомов.
 *
 * Все экраны кабинета устроены одинаково — «сходить в API, показать данные или ошибку», —
 * поэтому вместо повторения try/catch/finally в каждом модуле состояние описывается один раз.
 */
import { atom, computed, type Atom } from '#frontend/lib/atom.ts'

/**
 * Сколько запросов ресурсов идёт прямо сейчас. Счётчик, а не флаг: экран поднимает
 * несколько ресурсов сразу, и первый же ответ гасил бы индикатор при живых остальных.
 */
const inflight = atom(0)

/** Идёт ли хоть какая-то загрузка — по нему рисуется полоска фонового обновления. */
export const anyLoading = computed([inflight], () => inflight() > 0)

export type Resource<Args extends unknown[], T> = {
	data: Atom<T | null>
	loading: Atom<boolean>
	error: Atom<string | null>
	/** Загружает и раскладывает результат. Никогда не бросает — ошибка уходит в `error`. */
	load: (...args: Args) => Promise<void>
	/**
	 * Забывает прошлый ответ. Нужен там, где следующий запрос про ДРУГОЙ объект: `Async`
	 * намеренно держит старые данные во время рефетча, и без сброса карточка успевает
	 * показать предыдущего клиента как своего.
	 */
	reset: () => void
}

export function resource<Args extends unknown[], T>(fetcher: (...args: Args) => Promise<T>): Resource<Args, T> {
	const data = atom<T | null>(null)
	const loading = atom(false)
	const error = atom<string | null>(null)

	async function load(...args: Args) {
		loading.set(true)
		inflight.set(inflight() + 1)
		error.set(null)

		try {
			data.set(await fetcher(...args))
		} catch (e) {
			error.set(e instanceof Error ? e.message : 'Не удалось загрузить данные')
		} finally {
			loading.set(false)
			inflight.set(inflight() - 1)
		}
	}

	function reset() {
		data.set(null)
		error.set(null)
	}

	return { data, loading, error, load, reset }
}
