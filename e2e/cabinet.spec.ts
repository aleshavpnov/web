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

test('переход на СБП предупреждает о 1 ₽ и подтверждается без изменения срока доступа', async ({ page }) => {
	const until = '2030-12-03T08:44:22.594Z'
	let linked = false
	let checkouts = 0

	await page.route('https://telegram.org/**', (route) => route.fulfill({ contentType: 'text/javascript', body: '' }))

	await page.addInitScript(() => {
		window.open = () => null
	})

	await page.route('**/api/me/event', (route) => route.fulfill({ status: 204 }))

	await page.route('**/api/me/plans', (route) =>
		route.fulfill({
			json: {
				plans: [
					{
						code: 'monthly',
						name: 'Прайм',
						emoji: '',
						priceLabel: '149 ₽/мес',
						deviceLimit: 3,
						durationDays: 30,
						buyUrl: 'https://t.me/tribute',
						oneTimeMethods: [],
						sbpSubscription: { amount: 149, firstChargeAt: until, bindingAmount: 1 },
					},
				],
				gifts: [],
				current: { planCode: 'monthly', planName: 'Прайм' },
				pendingGifts: [],
				manageUrl: null,
			},
		}),
	)

	await page.route('**/api/me/overview', (route) =>
		route.fulfill({
			json: {
				kind: 'paid',
				sub: {
					planCode: 'monthly',
					planName: 'Прайм',
					planEmoji: '',
					status: 'active',
					type: 'regular',
					expiresAt: until,
					tributeExpiresAt: null,
					deviceLimit: 3,
					tributeWebAppLink: null,
					autoRenew: linked ? { provider: 'platega', nextChargeAt: until, cancelable: true } : null,
				},
				vip: null,
				trial: { available: false, days: 3 },
				pendingGifts: 0,
				support: { available: true },
				adminMiniAppUrl: null,
				botUsername: 'testbot',
			},
		}),
	)

	await page.route('**/api/me/checkout', (route) => {
		checkouts += 1
		linked = true

		return route.fulfill({
			json: { buyUrl: 'https://pay.example/subscribe', provider: 'platega_sub', deferredUntil: until },
		})
	})

	await page.goto('/me/#/buy/monthly')
	await expect(page.getByRole('button', { name: 'СБП с автопродлением' })).toBeVisible()
	await expect(page.getByText(/Сейчас спишется 1\s*₽/)).toBeVisible()
	await expect(page.getByText(/бонусными днями/)).toBeVisible()
	await page.screenshot({ path: 'test-results/tribute-platega-transition.png', fullPage: true })

	page.once('dialog', async (dialog) => {
		expect(dialog.message()).toContain('1 ₽ за привязку')
		expect(dialog.message()).toContain('149 ₽')
		await dialog.dismiss()
	})

	await page.getByRole('button', { name: 'СБП с автопродлением' }).click()
	expect(checkouts).toBe(0)
	page.once('dialog', (dialog) => dialog.accept())
	await page.getByRole('button', { name: 'СБП с автопродлением' }).click()
	await expect(page.getByText('Автопродление по СБП подключено')).toBeVisible({ timeout: 10_000 })
	await expect(page).toHaveURL(/\/me\/#\/$/)
	expect(checkouts).toBe(1)
})
