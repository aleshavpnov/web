import { siteChecks } from '@aimuzov/infra-site-kit/playwright/checks'
import { expect, test } from '@playwright/test'

// Бота в e2e нет: запросы к /status.json и /api уходят в пустоту, и браузер пишет об этом
// в консоль. Страницы такой отказ переживают, это не ошибка вёрстки.
const ignoreConsole = [/Failed to load resource/]

siteChecks({
	ignoreConsole,
	notFound: { suggest: false },
	theme: { button: (page) => page.getByRole('button', { name: /^Тема:/ }) },
})

// Голая разметка обезличена: сканер без JS не должен узнать сервис ни по одной странице.
for (const path of ['/', '/get/', '/status/', '/faq/', '/privacy/', '/terms/', '/app/add/', '/kit-404-probe']) {
	test(`${path}: в HTML без JS нет бренда`, async ({ request }) => {
		const html = await (await request.get(path)).text()
		// Хеши CSP и встроенный шрифт -- случайный base64, в нём «vpn» бывает просто так.
		const text = html.replace(/'sha256-[^']+'/g, '').replace(/data:[^)"']+/g, '')

		expect(text).not.toMatch(/alesha|vepenov|vpn/i)
		expect(html).toContain('<meta name="robots" content="noindex, nofollow">')
	})
}

test('/app/add/: открывает старые сборки Android через intent со ссылкой из фрагмента', async ({ page }) => {
	const subscription = 'https://aleshapodpiskov.ru/s/test?x=1&y=2'
	const payload = Buffer.from(subscription).toString('base64url')

	await page.goto(`/app/add/#u=${payload}`)

	await expect(page.getByRole('link', { name: 'Открыть в приложении' })).toHaveAttribute(
		'href',
		`intent://add?u=${payload}#Intent;scheme=aleshavpnov;package=online.aimuzov.aleshavpnov;S.browser_fallback_url=${encodeURIComponent('https://github.com/aimuzov/aleshavpnov-releases/releases')};end`,
	)
})
