import type { StatusIncident, StatusNode } from '#frontend/site/api/schemas.ts'

/** Окно, за которое страница показывает сбои и полосу серверов. */
export const WINDOW_DAYS = 30

/** Ниже этого аптайм за период подсвечивается: на глаз 99% и 97% иначе не различить. */
export const LOW_UPTIME = 99

export type DayTone = 'ok' | 'warn' | 'bad' | 'none'

/** Тон дня полосы: целый день в строю, был сбой, лежал больше половины дня, сервера ещё не было. */
export function dayTone(ratio: number | null): DayTone {
	if (ratio === null) return 'none'

	if (ratio >= 0.99) return 'ok'

	return ratio >= 0.5 ? 'warn' : 'bad'
}

export type Outage = {
	start: string
	/** null -- сбой ещё идёт. */
	end: string | null
	nodes: string[]
}

/**
 * Сбои за окно, новые сверху. Бот пишет инцидент на каждый узел, и когда падает мастер или
 * сеть до него, это пять одинаковых записей с одной минутой начала. Для читателя это один
 * сбой, поэтому записи с общей минутой начала склеиваются.
 */
export function groupOutages(incidents: StatusIncident[], now = Date.now()): Outage[] {
	const since = now - WINDOW_DAYS * 86_400_000
	const groups = new Map<string, Outage>()

	for (const i of incidents) {
		if (!i.startedAt || Date.parse(i.startedAt) < since) continue

		const key = i.startedAt.slice(0, 16)
		const group = groups.get(key) ?? { start: i.startedAt, end: i.resolvedAt, nodes: [] }
		const node = i.location ?? i.title

		if (!group.nodes.includes(node)) group.nodes.push(node)

		if (i.resolvedAt === null || group.end === null) group.end = null
		else if (i.resolvedAt > group.end) group.end = i.resolvedAt

		groups.set(key, group)
	}

	return [...groups.values()].sort((a, b) => b.start.localeCompare(a.start))
}

/** Форма слова по числу: 1 сбой, 2 сбоя, 5 сбоев. */
export function plural(n: number, [one, few, many]: [string, string, string]): string {
	const mod10 = n % 10
	const mod100 = n % 100

	if (mod10 === 1 && mod100 !== 11) return one

	return mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? few : many
}

/** Длительность сбоя: "10 мин", "4 ч 45 мин", "1 д 3 ч". */
export function formatDuration(start: string, end: string | null, now = Date.now()): string {
	const minutes = Math.max(1, Math.round(((end ? Date.parse(end) : now) - Date.parse(start)) / 60_000))
	const days = Math.floor(minutes / 1440)
	const hours = Math.floor((minutes % 1440) / 60)
	const rest = minutes % 60

	if (days) return hours ? `${days} д ${hours} ч` : `${days} д`

	if (hours) return rest ? `${hours} ч ${rest} мин` : `${hours} ч`

	return `${rest} мин`
}

function parts(iso: string, timeZone?: string) {
	const date = new Date(iso)
	const day = date.toLocaleDateString('ru-RU', { day: 'numeric', timeZone })
	// В краткой форме месяца у ru-RU точка в конце («окт.»), в строке сбоя она лишняя.
	const month = date.toLocaleDateString('ru-RU', { month: 'short', timeZone }).replace('.', '')

	return { day, month, time: date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone }) }
}

/** Дата сбоя: "20 окт", через полночь -- "11–12 окт", через границу месяца -- "31 окт – 1 нояб". */
export function formatOutageDate(start: string, end: string | null, timeZone?: string): string {
	const a = parts(start, timeZone)

	if (!end) return `${a.day} ${a.month}`

	const b = parts(end, timeZone)

	if (a.day === b.day && a.month === b.month) return `${a.day} ${a.month}`

	return a.month === b.month ? `${a.day}–${b.day} ${a.month}` : `${a.day} ${a.month} – ${b.day} ${b.month}`
}

/** Время сбоя: "18:00 – 08:10", идущий сбой -- "с 18:00". */
export function formatOutageTime(start: string, end: string | null, timeZone?: string): string {
	const from = parts(start, timeZone).time

	return end ? `${from} – ${parts(end, timeZone).time}` : `с ${from}`
}

/** Кого задел сбой: один сервер по имени, несколько -- числом и списком. */
export function describeOutage(outage: Outage): string {
	const n = outage.nodes.length

	return n === 1
		? outage.nodes[0]
		: `${n} ${plural(n, ['сервер', 'сервера', 'серверов'])}: ${outage.nodes.join(', ')}`
}

/** Полоса сервера за окно: последние WINDOW_DAYS дней, старые слева. */
export function windowBars(node: StatusNode): { day: string; tone: DayTone }[] {
	return node.bars.slice(-WINDOW_DAYS).map((b) => ({ day: b.day, tone: dayTone(b.ratio) }))
}
