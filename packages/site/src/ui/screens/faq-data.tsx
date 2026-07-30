import { reatomComponent } from '@reatom/react'
import type { ReactNode } from 'react'
import { navigate } from '@/state/screen.ts'
import { statusAtom } from '@/state/status.ts'
import type { Screen } from '@/lib/screen.ts'

/** Диплинк на подписку «Прайм» в Tribute (кнопка Share у подписки в дашборде). */
const TRIBUTE_SUB_URL = 'https://t.me/tribute/app?startapp=sVea'

export const SUPPORT_EMAIL = 'support@aimuzov.online'

const linkClass = 'text-emerald-500 hover:text-emerald-400 underline underline-offset-2'

/**
 * Ссылка на экран поддержки бота (?start=support). Username приходит с бэкенда
 * в status-payload — как deepLink у кнопки «Открыть в Telegram»; пока его нет,
 * рендерим просто текст.
 */
const SupportBotLink = reatomComponent(({ children }: { children: ReactNode }) => {
	const username = statusAtom()?.botUsername
	if (!username) return <>{children}</>
	return (
		<a
			href={`https://t.me/${username}?start=support`}
			target="_blank"
			rel="noopener noreferrer"
			className={linkClass}
		>
			{children}
		</a>
	)
})

function TributeLink({ children }: { children: ReactNode }) {
	return (
		<a href={TRIBUTE_SUB_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
			{children}
		</a>
	)
}

/** Инлайн-ссылка на внутренний экран — в стиле emerald-ссылок Access. */
function ScreenLink({ to, children }: { to: Screen; children: ReactNode }) {
	return (
		<button type="button" onClick={() => navigate(to)} className={linkClass}>
			{children}
		</button>
	)
}

export interface FaqEntry {
	id: string
	q: string
	a: ReactNode
}

export const FAQ_ITEMS: FaqEntry[] = [
	{
		id: 'what-is',
		q: 'Что такое Alesha Vepenov?',
		a: (
			<>
				Частный сервис для своих — закрытая сеть, а&nbsp;не&nbsp;массовый публичный сервис. Серверы
				в&nbsp;Европе, а&nbsp;в&nbsp;подписке — несколько профилей с&nbsp;разными способами
				подключения: если один перестал работать, достаточно переключиться на&nbsp;соседний. Доступ
				оформляется через Telegram-бот, а&nbsp;здесь на&nbsp;сайте можно{' '}
				<ScreenLink to="access">получить пробный доступ</ScreenLink> и&nbsp;следить за{' '}
				<ScreenLink to="status">состоянием серверов</ScreenLink>.
			</>
		),
	},
	{
		id: 'devices',
		q: 'Какие устройства и приложения поддерживаются?',
		a: (
			<>
				iOS, Android, Windows и&nbsp;macOS. Рекомендуем бесплатные приложения Happ или Incy (Incy
				недоступен на&nbsp;Windows) — сайт и&nbsp;бот дают ссылки под нужную платформу. Подписка
				также работает в&nbsp;других совместимых клиентах вроде v2rayNG, Hiddify и&nbsp;NekoBox —
				достаточно импортировать её по&nbsp;ссылке или QR-коду.
			</>
		),
	},
	{
		id: 'limits',
		q: 'Есть ли лимиты трафика или количества устройств?',
		a: (
			<>
				Ограничений нет — трафик безлимитный, число устройств любое. Подписка ограничена только
				сроком действия.
			</>
		),
	},
	{
		id: 'trial',
		q: 'Можно ли попробовать бесплатно?',
		a: (
			<>
				Да. В&nbsp;Telegram-боте выдаётся пробный период на&nbsp;3&nbsp;дня. Если из-за блокировок
				не&nbsp;открывается сам Telegram, поможет страница{' '}
				<ScreenLink to="access">«Получить доступ»</ScreenLink> — временный доступ
				на&nbsp;3&nbsp;часа и&nbsp;до&nbsp;5&nbsp;ГБ трафика, без регистрации и&nbsp;оплаты. Его как
				раз хватит, чтобы зайти в&nbsp;бот и&nbsp;получить пробный период или оформить подписку.
			</>
		),
	},
	{
		id: 'pricing',
		q: 'Сколько стоит и как оплатить?',
		a: (
			<>
				Тариф один — «Прайм», 149&nbsp;₽ в&nbsp;месяц. Оплата проходит через сервис{' '}
				<TributeLink>Tribute</TributeLink> прямо в&nbsp;Telegram, доступ активируется автоматически
				в&nbsp;течение минуты после оплаты.
			</>
		),
	},
	{
		id: 'cancel',
		q: 'Как отменить подписку или отключить автопродление?',
		a: (
			<>
				В&nbsp;любой момент через <TributeLink>Tribute</TributeLink> — там&nbsp;же, где проходила
				оплата, доступны управление подпиской, смена карты и&nbsp;отмена. После отмены доступ
				сохраняется до&nbsp;конца оплаченного периода.
			</>
		),
	},
	{
		id: 'referral',
		q: 'Есть ли реферальная программа?',
		a: (
			<>
				Да. За&nbsp;каждого друга, оформившего первую оплату по&nbsp;персональной ссылке,
				начисляются дополнительные дни подписки. Ссылка — в&nbsp;Telegram-боте.
			</>
		),
	},
	{
		id: 'logs',
		q: 'Ведутся ли логи?',
		a: (
			<>
				История посещаемых сайтов не&nbsp;отслеживается и&nbsp;не&nbsp;хранится. Для работы сервиса
				учитываются только технические данные — объём трафика и&nbsp;срок действия подписки.
			</>
		),
	},
	{
		id: 'speed',
		q: 'Замедлится ли соединение?',
		a: (
			<>
				Серверы стоят на&nbsp;быстрых европейских каналах, а&nbsp;приложение автоматически
				подключается к&nbsp;самому быстрому из&nbsp;доступных и&nbsp;переключается на&nbsp;резервный
				при сбоях. В&nbsp;повседневных сценариях разница незаметна.
			</>
		),
	},
	{
		id: 'troubleshoot',
		q: 'Не подключается — что делать?',
		a: (
			<>
				Сначала стоит проверить <ScreenLink to="status">страницу статуса</ScreenLink> — возможно,
				идут работы. Затем обновить подписку в&nbsp;приложении и&nbsp;убедиться, что включены
				«маршруты» (нужны для работы из&nbsp;России). Если не&nbsp;помогло — написать{' '}
				<SupportBotLink>в&nbsp;техподдержку в&nbsp;Telegram-боте</SupportBotLink>, приложив скриншот
				и&nbsp;указав устройство, — ответ придёт в&nbsp;тот&nbsp;же чат. Или на&nbsp;почту{' '}
				<a href={`mailto:${SUPPORT_EMAIL}`} className={linkClass}>
					{SUPPORT_EMAIL}
				</a>
				.
			</>
		),
	},
]
