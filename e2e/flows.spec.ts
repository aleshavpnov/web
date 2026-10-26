import { expect, test, type Page } from '@playwright/test'

// Ответы бота подменяются в браузере: в e2e его нет, а сценарии сайта без них не пройти.
const STATUS = {
	overall: 'operational',
	generatedAt: '2026-10-25T12:00:00.000Z',
	nodes: [
		{
			label: 'Нидерланды',
			status: 'operational',
			uptime: { d1: 100, d7: 99.9, d30: 99.8 },
			bars: [{ day: '2026-10-24', ratio: 1 }],
			lastCheck: null,
		},
	],
	internet: { latencyMs: 42 },
	traffic: { avgBps: 5_000_000, peakBps: 12_500_000, samples: 10 },
	botUsername: 'examplebot',
	incidents: [],
}

async function mockBot(page: Page) {
	await page.route('**/api/nonce', (route) => route.fulfill({ json: { token: `${Date.now() + 600_000}.sig` } }))
	await page.route('**/status.json', (route) => route.fulfill({ json: STATUS }))

	await page.route('**/api/bridge?**', (route) =>
		route.fulfill({
			json: {
				subscriptionUrl: 'https://example.com/s/abc123',
				deepLink: 'https://t.me/examplebot?start=c_tok',
				expiresAt: new Date(Date.now() + 3 * 3_600_000).toISOString(),
			},
		}),
	)
}

test('главная подставляет метрики из статуса', async ({ page }) => {
	await mockBot(page)
	await page.goto('/')

	await expect(page.getByRole('heading', { level: 1 })).toContainText('100 Мбит/с')
	await expect(page.getByRole('heading', { level: 1 })).toContainText('42 мс')
	await expect(page.getByText('Нидерланды')).toBeVisible()
	await expect(page).toHaveTitle('Alesha Vepenov')
})

test('/get выдаёт временную ссылку и ведёт в бота с привязкой', async ({ page }) => {
	await mockBot(page)
	await page.goto('/get')

	await page.getByRole('button', { name: 'Получить временный доступ' }).click()

	await expect(page.locator('#sub-url')).toHaveValue('https://example.com/s/abc123')

	await expect(page.getByRole('link', { name: 'Открыть в Telegram' })).toHaveAttribute(
		'href',
		'https://t.me/examplebot?start=c_tok',
	)

	// Ссылка переживает перезагрузку: повторный визит не плодит клиентов.
	await page.reload()
	await expect(page.locator('#sub-url')).toHaveValue('https://example.com/s/abc123')
})

test('/get переключает клиента и платформу', async ({ page }) => {
	await mockBot(page)
	await page.goto('/get')

	await page.getByRole('button', { name: 'Incy' }).click()
	await expect(page.getByText(/добавьте её в\s+Incy/).first()).toBeVisible()

	await page.getByRole('button', { name: 'другое устройство?' }).click()
	await page.getByRole('dialog').getByRole('button', { name: 'Windows' }).click()
	await expect(page.getByText(/Incy пока недоступен/)).toBeVisible()
})

test('/status показывает узлы и аптайм', async ({ page }) => {
	await mockBot(page)
	await page.goto('/status')

	await expect(page.getByText('Всё работает')).toBeVisible()
	await expect(page.getByText('100.0% / 24ч')).toBeVisible()
	await expect(page.getByText('Инцидентов за последние 30 дней нет')).toBeVisible()
})

test('/app/add собирает intent-ссылку из фрагмента', async ({ page }) => {
	await page.goto('/app/add#u=aHR0cHM6Ly9leGFtcGxlLmNvbS9zL2FiYzEyMw')

	await expect(page.getByRole('link', { name: 'Открыть в приложении' })).toHaveAttribute(
		'href',
		/^intent:\/\/add\?u=aHR0cHM6Ly9leGFtcGxlLmNvbS9zL2FiYzEyMw#Intent;/,
	)
})

test('/app/add без подписки просит открыть ссылку заново', async ({ page }) => {
	await page.goto('/app/add')

	await expect(page.getByRole('heading', { name: 'Ссылка неполная' })).toBeVisible()
})
