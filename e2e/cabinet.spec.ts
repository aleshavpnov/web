import { expect, test } from '@playwright/test'

// Кабинет вне Telegram: initData нет, бота в e2e тоже нет, и запросы к /api/me падают.
// Это не ошибка вёрстки, а вот исключение в скрипте или CSP-отказ — ошибка.
const ignoreConsole = [/Failed to load resource/]

test('/me/ вне Telegram открывается без ошибок в консоли', async ({ page }) => {
	const errors: string[] = []

	page.on('console', (msg) => {
		if (msg.type() === 'error' && !ignoreConsole.some((re) => re.test(msg.text()))) errors.push(msg.text())
	})

	page.on('pageerror', (err) => errors.push(err.message))

	// SDK Telegram с чужого хоста в e2e не нужен и не должен зависеть от сети.
	await page.route('https://telegram.org/**', (route) => route.fulfill({ contentType: 'text/javascript', body: '' }))

	const response = await page.goto('/me/')

	expect(response?.status()).toBe(200)
	await expect(page.getByRole('heading', { level: 1, name: 'Личный кабинет' })).toBeVisible()
	await expect(page.getByText('Открыто вне Telegram')).toBeVisible()
	await expect(page.getByRole('navigation')).toBeVisible()

	// Переход по вкладке пишет адрес через History API и меняет заголовок.
	await page.getByRole('button', { name: 'Доступ' }).click()
	await expect(page).toHaveURL(/\/me\/#\/connect$/)
	await expect(page.getByRole('heading', { level: 1, name: 'Подключение' })).toBeVisible()

	expect(errors).toEqual([])
})

test('/me/?go= открывает свой экран и вычищает query', async ({ page }) => {
	await page.route('https://telegram.org/**', (route) => route.fulfill({ contentType: 'text/javascript', body: '' }))
	await page.goto('/me/?go=usage')

	await expect(page.getByRole('heading', { level: 1, name: 'Трафик' })).toBeVisible()
	await expect(page).toHaveURL(/\/me\/#\/usage$/)
})

// Голая разметка обезличена: сканер без JS не должен узнать сервис и по кабинету. Хеши CSP
// и встроенный шрифт — base64, случайное «vpn» в них не бренд.
test('/me/: в HTML без JS нет бренда', async ({ request }) => {
	const html = await (await request.get('/me/')).text()
	const visible = html.replace(/'sha256-[^']+'/g, '').replace(/data:[^)"']+/g, '')

	expect(visible).not.toMatch(/alesha|vepenov|vpn/i)
	expect(html).toContain('<meta name="robots" content="noindex, nofollow">')
})
