/**
 * Аватары приглашённых друзей.
 *
 * Картинку нельзя отдать тегу напрямую: гейт кабинета читает `Authorization: tma …`, а
 * `<img src>` заголовков не шлёт (см. fetchAvatar). Поэтому качаем сами и держим objectURL
 * в модульном кэше — один и тот же человек не должен дёргать Telegram при каждом открытии экрана.
 */
import { fetchAvatar } from '#frontend/cabinet/api/client.ts'

/** Промис, а не готовый URL: два кружка одного tgId, смонтированные разом, качают один раз. */
const cache = new Map<string, Promise<string | null>>()

/** `full` — крупная версия для просмотра; кэшируется отдельно от миниатюры кружка. */
export function loadAvatar(tgId: number, full = false): Promise<string | null> {
	const key = `${tgId}:${full ? 'full' : 'thumb'}`
	let pending = cache.get(key)

	if (!pending) {
		pending = fetchAvatar(tgId, full)
			.then((blob) => (blob ? URL.createObjectURL(blob) : null))
			.catch(() => null)

		cache.set(key, pending)
	}

	return pending
}

/** Инициалы для плейсхолдера: «@ivan_petrov» → «IP», «Аня» → «АН». */
export function initials(label: string): string {
	const clean = label.replace(/^[@#]/, '').trim()

	if (!clean) return '?'

	const words = clean.split(/[\s._-]+/).filter(Boolean)
	const letters = words.length > 1 ? `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}` : clean.slice(0, 2)

	return letters.toUpperCase()
}
