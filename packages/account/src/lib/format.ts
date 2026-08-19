/** Форматирование чисел и дат для экранов кабинета. Часовой пояс — Москва, как в боте. */
const GB = 1024 ** 3
const MB = 1024 ** 2

/** Байты в человеческий вид: до гигабайта — МБ, дальше — ГБ. */
export function formatBytes(bytes: number): string {
	if (bytes >= GB) return `${(bytes / GB).toFixed(2)} ГБ`
	if (bytes >= MB) return `${(bytes / MB).toFixed(1)} МБ`
	return `${bytes} Б`
}

const dateOnly = new Intl.DateTimeFormat('ru-RU', {
	day: '2-digit',
	month: '2-digit',
	year: 'numeric',
	timeZone: 'Europe/Moscow',
})

const dayMonth = new Intl.DateTimeFormat('ru-RU', {
	day: '2-digit',
	month: '2-digit',
	timeZone: 'Europe/Moscow',
})

const timeOnly = new Intl.DateTimeFormat('ru-RU', {
	hour: '2-digit',
	minute: '2-digit',
	timeZone: 'Europe/Moscow',
})

/** ISO → «07.08.2026». Пустая/битая строка → «—». */
export function formatDate(iso: string | null | undefined): string {
	if (!iso) return '—'
	const ts = Date.parse(iso)
	return Number.isFinite(ts) ? dateOnly.format(ts) : '—'
}

export function formatDayMonth(iso: string): string {
	const ts = Date.parse(iso)
	return Number.isFinite(ts) ? dayMonth.format(ts) : iso
}

/**
 * Метка бакета расхода в подпись графика. Часовой бакет приходит как `YYYY-MM-DDTHH`
 * (UTC, без минут) — достраиваем до полного ISO, иначе Date.parse его не возьмёт.
 */
export function formatBucket(bucket: string, granularity: 'hour' | 'day'): string {
	if (granularity === 'day') return formatDayMonth(bucket)
	const ts = Date.parse(`${bucket}:00:00.000Z`)
	return Number.isFinite(ts) ? `${dayMonth.format(ts)} ${timeOnly.format(ts)}` : bucket
}

/** Давность момента: «только что» → «12 мин назад» → «3 ч назад» → «5 дн. назад». */
export function formatAgo(iso: string | null | undefined): string {
	if (!iso) return '—'
	const ts = Date.parse(iso)
	if (!Number.isFinite(ts)) return '—'
	const minutes = Math.floor((Date.now() - ts) / 60_000)
	if (minutes < 1) return 'только что'
	if (minutes < 60) return `${minutes} мин назад`
	const hours = Math.floor(minutes / 60)
	if (hours < 24) return `${hours} ч назад`
	return `${Math.floor(hours / 24)} дн. назад`
}

/** Русское склонение по числу: 1 день, 2 дня, 5 дней. */
export function plural(n: number, one: string, few: string, many: string): string {
	const mod10 = n % 10
	const mod100 = n % 100
	if (mod10 === 1 && mod100 !== 11) return one
	if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
	return many
}

/** Сколько суток осталось до даты; отрицательное — срок уже вышел. */
export function daysLeft(iso: string): number {
	const ts = Date.parse(iso)
	if (!Number.isFinite(ts)) return 0
	return Math.ceil((ts - Date.now()) / 86_400_000)
}

/** «осталось 12 дней» / «истекла 3 дня назад» — главная строка карточки подписки. */
export function formatRemaining(iso: string): string {
	const days = daysLeft(iso)
	if (days === 0) return 'истекает сегодня'
	if (days > 0) return `осталось ${days} ${plural(days, 'день', 'дня', 'дней')}`
	const gone = -days
	return `истекла ${gone} ${plural(gone, 'день', 'дня', 'дней')} назад`
}

/** «3 устройства» — подпись лимита тарифа. */
export function formatDevices(limit: number): string {
	return `${limit} ${plural(limit, 'устройство', 'устройства', 'устройств')}`
}

/**
 * Строка про комиссию внутри кнопки способа оплаты. Комиссия начисляется сверх цены тарифа,
 * поэтому на форме сумма будет больше — человек должен видеть это на самой кнопке, которую
 * нажимает. Формулировка короткая по той же причине: в кнопке живёт одна строка, а не абзац.
 * `null` (процент не задан) — строки нет: молчание честнее выдуманной цифры.
 */
export function feeNote(percent: number | null | undefined): string | undefined {
	if (percent == null) return undefined
	return `+${percent}% комиссия платёжной системы`
}
