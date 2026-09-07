/**
 * Диплинки собственного Android-клиента «Alesha Vpnov»: как передать ему ссылку-подписку
 * из кабинета и с лендинга.
 *
 * Ссылка-подписка едет во фрагменте (`#u=…`), а не в query: фрагмент браузер на сервер
 * не отправляет, и секрет не оседает в логах Caddy и прокси по дороге. Кодируем в
 * base64url, а не просто URL-encode: внутри лежит ещё один URL со своим `?`/`#`, и
 * двойное экранирование клиенты Android разбирают по-разному.
 *
 * Telegram на Android открывает https-ссылки в Custom Tabs мимо App Links, поэтому
 * страница-мост `/app/add` на лендинге показывает кнопку с `intent://`-ссылкой —
 * её Chrome отдаёт приложению по клику. Автопереход без клика Chrome блокирует.
 */

/** Страница-мост на лендинге: сюда ведёт диплинк из кабинета. */
export const APP_ADD_PAGE = 'https://durov.aimuzov.online/app/add'

/** Страница приложения на лендинге — fallback intent-ссылки, если клиент не установлен. */
export const APP_PAGE = 'https://durov.aimuzov.online/app'

const APP_SCHEME = 'aleshavpnov'
const APP_PACKAGE = 'online.aimuzov.aleshavpnov'

/** base64url без padding от UTF-8 байтов — без Buffer: пакет браузерный. */
export function encodeAppAddParam(value: string): string {
	const bytes = new TextEncoder().encode(value)
	let bin = ''
	for (const b of bytes) bin += String.fromCharCode(b)
	return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Обратное к {@link encodeAppAddParam}. `null` на любом мусоре и на всём, что не
 * http(s)-URL: параметр приходит из адресной строки, и подсовывать приложению
 * произвольную схему нельзя.
 */
export function decodeAppAddParam(u: string): string | null {
	if (!u || !/^[A-Za-z0-9_-]+$/.test(u)) return null
	const b64 = u.replace(/-/g, '+').replace(/_/g, '/')
	let decoded: string
	try {
		const bin = atob(b64)
		const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0))
		decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
	} catch {
		return null
	}
	let parsed: URL
	try {
		parsed = new URL(decoded)
	} catch {
		return null
	}
	if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null
	return decoded
}

/** App Link на страницу-мост с подпиской во фрагменте. */
export function buildAppAddLink(subscriptionUrl: string): string {
	return `${APP_ADD_PAGE}#u=${encodeAppAddParam(subscriptionUrl)}`
}

/**
 * `intent://`-ссылка для кнопки на странице-мосте. Chrome по клику отдаёт её приложению,
 * а без него уходит на `fallbackUrl` — страницу, где приложение можно скачать.
 */
export function buildAppIntentUrl(u: string, fallbackUrl: string): string {
	return (
		`intent://add?u=${u}#Intent;scheme=${APP_SCHEME};package=${APP_PACKAGE};` +
		`S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};end`
	)
}
