/**
 * Копирование в буфер с запасным путём.
 *
 * `navigator.clipboard` есть не везде, где живёт админка: вебвью Telegram на части Android
 * отдаёт его только в защищённом контексте и только по жесту пользователя, а на старых
 * версиях не отдаёт вовсе. Отсюда второй путь через скрытый `<textarea>` и `execCommand`:
 * метод давно объявлен устаревшим, но это единственное, что работает там, где нет первого.
 */
import { hapticSuccess } from './telegram.ts'

function legacyCopy(value: string): boolean {
	const area = document.createElement('textarea')
	area.value = value
	// Вне экрана, а не `display: none`: скрытый элемент нельзя выделить, а без выделения
	// копировать нечего. readOnly — чтобы на мобильных не выехала клавиатура.
	area.setAttribute('readonly', '')
	area.style.position = 'fixed'
	area.style.top = '-1000px'
	document.body.appendChild(area)
	area.select()
	try {
		return document.execCommand('copy')
	} catch {
		return false
	} finally {
		area.remove()
	}
}

/** Копирует значение; `false` — не удалось ни одним способом (вызывающий покажет ошибку). */
export async function copyText(value: string): Promise<boolean> {
	let ok = false
	try {
		await navigator.clipboard.writeText(value)
		ok = true
	} catch {
		ok = legacyCopy(value)
	}
	if (ok) hapticSuccess()
	return ok
}
