import type { Health } from '#frontend/site/api/schemas.ts'

export const HEALTH_LABEL: Record<Health, string> = {
	operational: 'Всё работает',
	degraded: 'Частичные проблемы',
	down: 'Сбой',
	unknown: 'Статус неизвестен',
}
