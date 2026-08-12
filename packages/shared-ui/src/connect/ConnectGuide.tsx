/**
 * Инструкция подключения: выбор клиента и платформы, шаги установки и шаги добавления
 * ссылки-подписки. Компоненты чистые — ни состояния приложения, ни роутинга, ни данных
 * о пользователе: всё нужное приходит пропсами.
 *
 * Обёртки (карточка, номер шага, заголовок) остаются за потребителем: у лендинга это
 * «Шаг 1/2/3» на своей вёрстке, у кабинета — карточки shadcn.
 */
import { useEffect, useState, type ReactNode } from 'react'
import { Check, Copy, Download, Plus, Power, Route } from 'lucide-react'

import {
	CLIENTS,
	CLIENT_ORDER,
	platforms,
	type ClientConfig,
	type ClientId,
	type InstallMethod,
	type Platform,
	type Store,
} from './apps.tsx'

/**
 * CTA-кнопка «Скачать» — на отдельной строке под текстом шага. Высота 40px: инструкцию
 * читают с телефона (и на лендинге, и в кабинете), а по кнопке в 28px палец промахивается.
 */
const downloadBtnClass =
	'flex min-h-10 w-fit items-center gap-1.5 mt-2 bg-emerald-500 hover:bg-emerald-400 ' +
	'text-white font-semibold text-[0.8125rem] uppercase tracking-wide px-4 py-2 rounded-md ' +
	'transition-all hover:shadow-md hover:shadow-emerald-500/30 active:scale-95'

/** Заголовок шага — заметный emerald-бейдж, чтобы шаги не терялись. */
export const stepBadgeClass =
	'inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-bold uppercase tracking-wider text-emerald-500'

/** Название клиента как ссылка на его сайт, с фирменной иконкой. */
export function ClientLink({ client }: { client: ClientConfig }) {
	const Icon = client.Icon
	return (
		<a
			href={client.site}
			target="_blank"
			rel="noopener noreferrer"
			className="inline-flex items-center gap-1 font-semibold text-emerald-500 hover:text-emerald-400 underline underline-offset-2"
		>
			<Icon className="h-[0.95em] w-auto shrink-0 no-underline" />
			{client.name}
		</a>
	)
}

/**
 * Инлайн-чип, имитирующий кнопку интерфейса Happ/Incy внутри текста инструкции.
 * Размер задаётся в месте вызова: иконочные чипы — size-5, кнопка с подписью — px/py.
 */
function InlineKey({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<span
			className={`inline-flex items-center justify-center gap-1 mx-1 align-middle border ${className}`}
		>
			{children}
		</span>
	)
}

/** Общее модальное окно: затемнённый оверлей + панель, закрытие по Escape/клику вне. */
export function Dialog({
	open,
	title,
	onClose,
	children,
}: {
	open: boolean
	title: string
	onClose: () => void
	children: ReactNode
}) {
	useEffect(() => {
		if (!open) return
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		}
		document.addEventListener('keydown', onKey)
		return () => document.removeEventListener('keydown', onKey)
	}, [open, onClose])

	if (!open) return null

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
			role="dialog"
			aria-modal="true"
		>
			<div className="absolute inset-0 bg-black/50" onClick={onClose} />
			<div className="relative z-10 w-full max-w-xs rounded-xl border border-border bg-background p-4 shadow-xl">
				<p className="text-sm font-semibold mb-3">{title}</p>
				<div className="flex flex-col gap-1">{children}</div>
			</div>
		</div>
	)
}

function DownloadButton({ href, device }: { href: string; device: string }) {
	return (
		<a href={href} target="_blank" rel="noopener noreferrer" className={downloadBtnClass}>
			<Download className="size-3.5" />
			Скачать для {device}
		</a>
	)
}

/** CTA «Добавить» — открывает routing-страницу клиента, которая ставит маршруты обхода. */
function RoutingButton({ href }: { href: string }) {
	return (
		<a href={href} target="_blank" rel="noopener noreferrer" className={downloadBtnClass}>
			<Route className="size-3.5" />
			Добавить
		</a>
	)
}

/** Магазины приложений: кнопка открывает поповер с выбором (iOS у обоих, а у Incy и Mac). */
function StoreDownloadButton({ stores, device }: { stores: Store[]; device: string }) {
	const [open, setOpen] = useState(false)
	const itemClass =
		'flex min-h-11 items-center rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors'

	return (
		<>
			<button type="button" className={downloadBtnClass} onClick={() => setOpen(true)}>
				<Download className="size-3.5" />
				Скачать для {device}
			</button>
			<Dialog open={open} title="Выберите магазин" onClose={() => setOpen(false)}>
				{stores.map((s) => (
					<a
						key={s.href}
						href={s.href}
						target="_blank"
						rel="noopener noreferrer"
						onClick={() => setOpen(false)}
						className={itemClass}
					>
						{s.label}
					</a>
				))}
			</Dialog>
		</>
	)
}

/** Пометка для платформы, под которую у клиента нет версии (Windows у Incy). */
function UnavailableNote({ name, siteHref }: { name: string; siteHref: string }) {
	return (
		<>
			{name} пока недоступен для&nbsp;этой платформы.{' '}
			<a
				href={siteHref}
				target="_blank"
				rel="noopener noreferrer"
				className="text-emerald-500 hover:text-emerald-400 underline underline-offset-2"
			>
				Открыть сайт
			</a>
		</>
	)
}

/** Пункт «установите приложение» — единственный платформо-зависимый шаг. */
function renderInstall(method: InstallMethod, client: ClientConfig): ReactNode {
	if (method.kind === 'stores')
		return (
			<>
				Установите приложение <StoreDownloadButton stores={method.stores} device={method.device} />
			</>
		)
	if (method.kind === 'direct')
		return (
			<>
				Установите приложение <DownloadButton href={method.href} device={method.device} />
			</>
		)
	return <UnavailableNote name={client.name} siteHref={client.site} />
}

/** Нумерованный список — общая разметка всех шагов инструкции. */
function StepList({ items }: { items: ReactNode[] }) {
	return (
		<ol className="space-y-3">
			{items.map((text, i) => (
				<li key={i} className="flex gap-2 items-start">
					<span className="text-emerald-500 font-bold text-sm leading-relaxed w-4 shrink-0">
						{i + 1}
					</span>
					<span className="text-sm text-foreground/80 leading-relaxed">{text}</span>
				</li>
			))}
		</ol>
	)
}

/** Шаги установки приложения: поставить и настроить маршруты обхода. */
export function InstallSteps({ client, platform }: { client: ClientConfig; platform: Platform }) {
	return (
		<StepList
			items={[
				renderInstall(client.install[platform], client),
				<>
					Для работы внутри&nbsp;РФ нужны маршруты: <RoutingButton href={client.routingUrl} />
				</>,
			]}
		/>
	)
}

/**
 * Шаги добавления ссылки-подписки в приложение. У Incy кнопка «Вставить» добавляет подписку
 * из буфера за один тап, поэтому отдельного шага «Добавить из буфера» (как у Happ) для него нет.
 */
export function AddSubscriptionSteps({ client }: { client: ClientConfig }) {
	const addText =
		client.id === 'incy' ? (
			<>
				Скопируйте ссылку-подписку и&nbsp;добавьте её в&nbsp;{client.name}: справа снизу нажмите{' '}
				<InlineKey className="rounded border-border bg-muted text-foreground px-1.5 py-0.5 text-xs font-medium">
					<Copy className="size-3.5" />
					Вставить
				</InlineKey>
			</>
		) : (
			<>
				Скопируйте ссылку-подписку и&nbsp;добавьте её в&nbsp;{client.name}: справа сверху нажмите{' '}
				<InlineKey className="size-5 rounded border-border bg-muted text-foreground">
					<Plus className="size-3.5" />
				</InlineKey>
			</>
		)

	const items: ReactNode[] = [addText]
	if (client.id !== 'incy') items.push(<>Выберите «Добавить из&nbsp;буфера»</>)
	items.push(
		<>
			Нажмите кнопку подключения{' '}
			<InlineKey className="size-5 rounded-full border-emerald-500/40 bg-emerald-500/15 text-emerald-500">
				<Power className="size-3" />
			</InlineKey>
		</>,
	)

	return <StepList items={items} />
}

/** Тогглер клиента: переключает все ссылки и название приложения в инструкции. */
export function ClientToggle({
	value,
	onChange,
}: {
	value: ClientId
	onChange: (id: ClientId) => void
}) {
	return (
		<div className="inline-flex rounded-lg border border-border p-0.5">
			{CLIENT_ORDER.map((c) => {
				const Icon = CLIENTS[c].Icon
				return (
					<button
						key={c}
						type="button"
						onClick={() => onChange(c)}
						className={`inline-flex min-h-10 items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold uppercase tracking-wide transition-colors ${
							c === value
								? 'bg-emerald-500/10 text-emerald-500'
								: 'text-muted-foreground hover:text-foreground'
						}`}
					>
						<Icon className="h-4 w-auto shrink-0" />
						{CLIENTS[c].name}
					</button>
				)
			})}
		</div>
	)
}

/** Выбор платформы вручную — «инструкция для другого устройства». */
export function PlatformDialog({
	open,
	current,
	onSelect,
	onClose,
}: {
	open: boolean
	current: Platform
	onSelect: (p: Platform) => void
	onClose: () => void
}) {
	return (
		<Dialog open={open} title="Выберите платформу" onClose={onClose}>
			{platforms.map((p) => (
				<button
					key={p.key}
					type="button"
					onClick={() => {
						onSelect(p.key)
						onClose()
					}}
					className={`flex min-h-11 items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
						p.key === current
							? 'bg-emerald-500/10 text-emerald-500 font-semibold'
							: 'text-foreground hover:bg-muted'
					}`}
				>
					{p.label}
					{p.key === current && <Check className="size-4" />}
				</button>
			))}
		</Dialog>
	)
}
