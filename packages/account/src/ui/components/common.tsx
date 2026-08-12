/** Мелкие переиспользуемые куски интерфейса кабинета. */
import { useEffect, useState, type ReactNode } from 'react'
import { AlertTriangleIcon, CheckIcon, CopyIcon } from 'lucide-react'
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
	'px-2.5 text-xs data-active:bg-brand data-active:text-brand-foreground dark:data-active:bg-brand dark:data-active:text-brand-foreground'

/** Переключатель «одно из нескольких»: окно графика, платформа, тариф. */
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
			<TabsList>
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

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<h2 className={cn('mb-2 text-sm font-semibold text-muted-foreground', className)}>
			{children}
		</h2>
	)
}

/** Плитка со значением: крупное число и подпись. */
export function StatTile({
	label,
	value,
	hint,
}: {
	label: string
	value: ReactNode
	hint?: ReactNode
}) {
	return (
		<div className={SECTION_CARD}>
			<div className="text-xs text-muted-foreground">{label}</div>
			<div className="mt-1 text-2xl leading-tight font-semibold">{value}</div>
			{hint !== undefined && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
		</div>
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
				'inline-flex items-center gap-1 transition-colors hover:text-foreground',
				className,
			)}
		>
			{children ?? value}
			{copied ? (
				<CheckIcon className="size-3 shrink-0 text-viz-good" />
			) : (
				<CopyIcon className="size-3 shrink-0 opacity-60" />
			)}
		</button>
	)
}
