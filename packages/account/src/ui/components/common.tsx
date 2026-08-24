/** Мелкие переиспользуемые куски интерфейса кабинета. */
import { useEffect, useState, type ReactNode } from 'react'
import { AlertTriangleIcon, CheckIcon, ChevronRightIcon, CopyIcon } from 'lucide-react'
import QRCode from 'qrcode'
import { toast } from 'sonner'

import { Skeleton } from '@/components/ui/skeleton.tsx'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx'
import { copyText } from '@/lib/clipboard.ts'
import { cn } from '@/lib/utils.ts'

/**
 * Обёртка «загрузка / ошибка / данные». Ошибку показываем текстом от сервера: он
 * человеческий (см. fail() в cabinet-api.ts), и клиенту он полезнее, чем «что-то пошло не так».
 */
export function Async<T>({
	data,
	loading,
	error,
	children,
	skeleton,
	className,
}: {
	data: T | null
	loading: boolean
	error: string | null
	children: (data: T) => ReactNode
	skeleton?: ReactNode
	/** Классы обёртки с данными: вертикальный ритм экрана обязан жить здесь, а не снаружи. */
	className?: string
}) {
	if (error) {
		return (
			<div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
				<AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
				<span>{error}</span>
			</div>
		)
	}
	// Данные держим на экране во время рефетча — иначе экран моргает скелетоном при
	// каждом переключении окна.
	if (data === null) {
		return loading ? (
			(skeleton ?? <Skeleton className="h-24 w-full" />)
		) : (
			<div className="py-6 text-sm text-muted-foreground">Нет данных</div>
		)
	}
	return (
		<div className={cn(className, loading && 'opacity-60 transition-opacity')}>
			{children(data)}
		</div>
	)
}

/** Карточка секции: тот же фон, скругление и обводка у всех блоков с содержимым. */
export const SECTION_CARD = 'rounded-xl bg-card p-4 ring-1 ring-foreground/10'

/** Кнопка во «включённом» состоянии: фирменный зелёный вместо нейтрального primary. */
export const BRAND_ON = 'bg-brand text-brand-foreground hover:bg-brand/85'

const SEGMENT_TRIGGER =
	'px-3 text-sm data-active:bg-brand data-active:text-brand-foreground dark:data-active:bg-brand dark:data-active:text-brand-foreground'

/**
 * Переключатель «одно из нескольких»: окно графика, платформа, тариф.
 * Панель во всю ширину и ростом с кнопку — делениями попадают пальцем так же часто.
 */
export function Segmented<T extends string>({
	value,
	onValueChange,
	options,
	disabled,
	className,
}: {
	value: T
	onValueChange: (value: T) => void
	options: ReadonlyArray<{ value: T; label: string }>
	disabled?: boolean
	className?: string
}) {
	return (
		<Tabs
			value={value}
			onValueChange={(next) => onValueChange(String(next) as T)}
			className={className}
		>
			<TabsList className="h-11 w-full">
				{options.map((o) => (
					<TabsTrigger
						key={o.value}
						value={o.value}
						disabled={disabled}
						className={SEGMENT_TRIGGER}
					>
						{o.label}
					</TabsTrigger>
				))}
			</TabsList>
		</Tabs>
	)
}

/** Строка «ключ — значение» для карточек. */
export function Row({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="flex items-baseline justify-between gap-3 py-1 text-sm">
			<span className="shrink-0 text-muted-foreground">{label}</span>
			<span className="text-right">{children}</span>
		</div>
	)
}

/**
 * Строка тарифа с выделенными числами: «<b>10</b> устройств · <b>449</b> ₽/мес».
 *
 * Выбирают тариф по двум цифрам — сколько устройств и сколько денег, — а в приглушённой
 * строке подписи они тонули наравне со словами. Разметку не заводим: числа находим в уже
 * готовой строке, чтобы источником текста остались `formatDevices` и `priceLabel`.
 */
export function PlanFigures({ text, className }: { text: string; className?: string }) {
	return (
		<span className={className}>
			{text.split(/(\d+(?:[.,]\d+)?)/).map((part, i) =>
				/^\d/.test(part) ? (
					// eslint-disable-next-line react/no-array-index-key -- части одной статичной строки
					<b key={i} className="font-semibold text-foreground">
						{part}
					</b>
				) : (
					part
				),
			)}
		</span>
	)
}

/** Подпись внутри карточки: приглушённая, потому что главное в карточке — её содержимое. */
export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<h2 className={cn('mb-2 text-sm font-semibold text-muted-foreground', className)}>
			{children}
		</h2>
	)
}

/**
 * Плитка со значением: крупное число и подпись. С `onClick` становится кнопкой — плитки
 * главной так ведут в свои разделы, и шеврон в углу говорит, что нажатие куда-то ведёт.
 */
export function StatTile({
	label,
	value,
	hint,
	Icon,
	onClick,
}: {
	label: string
	value: ReactNode
	hint?: ReactNode
	Icon?: typeof CheckIcon
	onClick?: () => void
}) {
	const body = (
		<>
			<div className="flex items-center justify-between gap-2">
				<span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
					{Icon && <Icon className="size-3.5 shrink-0" />}
					<span className="truncate">{label}</span>
				</span>
				{onClick && <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />}
			</div>
			<div className="mt-1 text-2xl leading-tight font-semibold">{value}</div>
			{hint !== undefined && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
		</>
	)

	if (!onClick) return <div className={SECTION_CARD}>{body}</div>
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(SECTION_CARD, 'w-full text-left transition-colors hover:bg-muted/50')}
		>
			{body}
		</button>
	)
}

/** Сколько держится галочка после копирования. */
const COPIED_MS = 1200

/**
 * Значение, которое копируется по клику. В мини-аппе выделить текст пальцем практически
 * нельзя (жест уходит вебвью на прокрутку), поэтому единственный рабочий способ забрать
 * ссылку — кнопка. Иконка меняется на галочку на секунду: отклик нужен там, куда смотрит палец.
 */
export function CopyValue({
	value,
	children,
	className,
}: {
	value: string
	children?: ReactNode
	className?: string
}) {
	const [copied, setCopied] = useState(false)

	useEffect(() => {
		if (!copied) return
		const timer = setTimeout(() => setCopied(false), COPIED_MS)
		return () => clearTimeout(timer)
	}, [copied])

	async function onClick() {
		if (await copyText(value)) {
			setCopied(true)
			toast.success('Скопировано')
		} else {
			toast.error('Не удалось скопировать')
		}
	}

	return (
		<button
			type="button"
			title="Скопировать"
			onClick={() => void onClick()}
			className={cn(
				// min-h-11: строка со ссылкой — такая же кнопка, как остальные, и по ней
				// целятся пальцем ровно так же.
				'inline-flex min-h-11 items-center gap-2 transition-colors hover:text-foreground',
				className,
			)}
		>
			{children ?? value}
			{copied ? (
				<CheckIcon className="size-4 shrink-0 text-viz-good" />
			) : (
				<CopyIcon className="size-4 shrink-0 opacity-60" />
			)}
		</button>
	)
}

/** Ссылка длиннее этого режется многоточием: целиком она всё равно не читается. */
const URL_VISIBLE_LEN = 42

export function shorten(url: string): string {
	return url.length > URL_VISIBLE_LEN ? `${url.slice(0, URL_VISIBLE_LEN)}…` : url
}

/** QR во всю ширину карточки: код рисуем крупно, чтобы читался с чужого телефона. */
export function Qr({ value, alt }: { value: string; alt: string }) {
	const [qr, setQr] = useState<string | null>(null)

	useEffect(() => {
		let alive = true
		// width 1024 — с запасом под ширину экрана на ретине: масштабируем вниз, не вверх.
		QRCode.toDataURL(value, { margin: 1, width: 1024 })
			.then((data) => alive && setQr(data))
			.catch(() => alive && setQr(null))
		return () => {
			alive = false
		}
	}, [value])

	return (
		<div className="aspect-square w-full overflow-hidden rounded-xl bg-white p-3">
			{qr && <img src={qr} alt={alt} className="size-full" />}
		</div>
	)
}
