/**
 * Асинхронный ресурс: данные, флаг загрузки и текст ошибки одним набором атомов.
 *
 * Все экраны админки устроены одинаково — «сходить в API, показать данные или ошибку», —
 * поэтому вместо повторения try/catch/finally в каждом модуле состояние описывается один раз.
 */
import { action, atom, wrap } from '@reatom/core'

export interface Resource<Args extends unknown[], T> {
	dataAtom: ReturnType<typeof atom<T | null>>
	loadingAtom: ReturnType<typeof atom<boolean>>
	errorAtom: ReturnType<typeof atom<string | null>>
	/** Загружает и раскладывает результат. Никогда не бросает — ошибка уходит в errorAtom. */
	load: (...args: Args) => Promise<void>
	/**
	 * Забывает прошлый ответ. Нужен там, где следующий запрос про ДРУГОЙ объект: `Async`
	 * намеренно держит старые данные во время рефетча, и без сброса карточка успевает
	 * показать предыдущего клиента как своего.
	 */
	reset: () => void
}

export function resource<Args extends unknown[], T>(
	name: string,
	fetcher: (...args: Args) => Promise<T>,
): Resource<Args, T> {
	const dataAtom = atom<T | null>(null, name)
	const loadingAtom = atom<boolean>(false, `${name}Loading`)
	const errorAtom = atom<string | null>(null, `${name}Error`)

	const load = action(async (...args: Args) => {
		loadingAtom.set(true)
		errorAtom.set(null)
		try {
			dataAtom.set(await wrap(fetcher(...args)))
		} catch (e) {
			errorAtom.set(e instanceof Error ? e.message : 'Не удалось загрузить данные')
		} finally {
			loadingAtom.set(false)
		}
	}, `load${name}`)

	const reset = action(() => {
		dataAtom.set(null)
		errorAtom.set(null)
	}, `reset${name}`)

	return { dataAtom, loadingAtom, errorAtom, load, reset }
}
