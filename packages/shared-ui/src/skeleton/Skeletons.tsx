/**
 * Кости скелетонов: общий набор для лендинга, кабинета и админки.
 *
 * Скелетон здесь не «серый прямоугольник вместо экрана», а тот же экран, из которого вынули
 * текст: карточка на месте карточки, круг с силуэтом человека на месте аватара, столбики на
 * месте графика. Так видно, что именно грузится, и — главное — блок занимает свою будущую
 * высоту, поэтому подстановка данных не двигает вёрстку.
 *
 * Компоненты чистые: раскладку, отступы и классы карточки задаёт потребитель — у кабинета и
 * админки это `SECTION_CARD`, у лендинга своя рамка.
 *
 * Правило, которое держит высоту: полоска живёт в контейнере ростом со строку текста.
 * Одна `h-3` вместо строки в 20px схлопнула бы блок на 8px — и вся карточка поехала бы вверх.
 */
import type { ReactNode } from 'react'
import { UserRoundIcon } from 'lucide-react'

/**
 * Заливка кости — та же, что у shadcn-`Skeleton` в каждом из фронтов. Скругление стоит
 * отдельно от заливки: `cn` (а с ним и tailwind-merge) здесь нет, и дописанный следом
 * `rounded-full` не отменил бы `rounded-md` — победил бы порядок правил в CSS, а не в
 * атрибуте. Круглым костям заливка достаётся без скругления, своё они ставят сами.
 */
const FILL = 'bg-muted animate-pulse'
const BONE = `${FILL} rounded-md`

/** Иконка внутри кости: приглушена до фона, потому что это форма, а не содержимое. */
const ICON = 'text-muted-foreground/40'

type Icon = (props: { className?: string }) => ReactNode

/** Прямоугольник произвольного размера: размер задаёт `className`. */
export function Bone({ className = '' }: { className?: string }) {
	return <div aria-hidden className={`${BONE} ${className}`} />
}

/**
 * Полоска на месте строки текста. `line` — рост самой строки (`h-5` для `text-sm`, `h-4`
 * для `text-xs`), `className` — размер кости внутри неё.
 */
export function TextBone({
	line = 'h-5',
	className = 'h-3.5 w-32',
}: {
	line?: string
	className?: string
}) {
	return (
		<div className={`flex ${line} items-center`}>
			<Bone className={className} />
		</div>
	)
}

const AVATAR = {
	sm: { box: 'size-9', icon: 'size-4' },
	md: { box: 'size-11', icon: 'size-5' },
} as const

/** Круг на месте аватара — с силуэтом человека, размеры те же, что у `Avatar`. */
export function AvatarBone({
	size = 'sm',
	className = '',
}: {
	size?: keyof typeof AVATAR
	className?: string
}) {
	const { box, icon } = AVATAR[size]
	return (
		<div
			aria-hidden
			className={`${FILL} ${box} flex shrink-0 items-center justify-center rounded-full ${className}`}
		>
			<UserRoundIcon className={`${icon} ${ICON}`} />
		</div>
	)
}

/** Плашка на месте бейджа: статус подписки, метка vip, пометка группы. */
export function BadgeBone({ className = 'w-16' }: { className?: string }) {
	return <div aria-hidden className={`${FILL} h-5 shrink-0 rounded-4xl ${className}`} />
}

/** «Пилюля» на месте тумблера — ростом с дорожку `Switch`. */
export function SwitchBone() {
	return <div aria-hidden className={`${FILL} h-7 w-12 shrink-0 rounded-full`} />
}

/** Кнопка во всю ширину карточки. Высоту задаёт потребитель: она разная у фронтов. */
export function ButtonBone({ className = 'h-11 w-full' }: { className?: string }) {
	return <Bone className={className} />
}

/**
 * Плитка со значением на месте `StatTile`: подпись с иконкой, крупное число, хинт.
 * Иконка — та же, что стоит в готовой плитке: по ней плитку и узнают до загрузки.
 */
export function TileBone({
	className = '',
	Icon,
	label = 'w-20',
	value = 'w-14',
	hint = 'w-24',
}: {
	/** Классы карточки: `SECTION_CARD` у мини-аппов, своя рамка у лендинга. */
	className?: string
	Icon?: Icon
	label?: string
	value?: string
	/** Пустая строка убирает хинт — у плиток без него высота на строку меньше. */
	hint?: string
}) {
	return (
		<div className={className}>
			<div className="flex h-4 items-center gap-1.5">
				{Icon && <Icon className={`size-3.5 shrink-0 ${ICON}`} />}
				<Bone className={`h-3 ${label}`} />
			</div>
			{/* 1.875rem — рост `text-2xl leading-tight`, то есть строки с самим числом. */}
			<div className="mt-1 flex h-[1.875rem] items-center">
				<Bone className={`h-6 ${value}`} />
			</div>
			{hint && (
				<div className="mt-0.5 flex h-4 items-center">
					<Bone className={`h-3 ${hint}`} />
				</div>
			)}
		</div>
	)
}

/** Строка по умолчанию: имя и подпись под ним — так устроено большинство списков. */
const DEFAULT_LINES = ['w-32', 'w-52'] as const

/**
 * Строка списка: что-то слева (аватар, иконка), одна-две полоски текста и хвост справа —
 * число, шеврон, тумблер. Ширины полосок задают экраны: у логина и срока они разные.
 */
export function RowBone({
	className = 'px-3 py-2',
	leading,
	lines = DEFAULT_LINES,
	tail,
}: {
	className?: string
	leading?: ReactNode
	lines?: readonly string[]
	tail?: ReactNode
}) {
	return (
		<div className={`flex items-center gap-3 ${className}`}>
			{leading}
			<div className="min-w-0 flex-1 space-y-1.5">
				{lines.map((width, i) => (
					// eslint-disable-next-line react/no-array-index-key -- полоски статичны и не пересортировываются
					<Bone key={i} className={`${i === 0 ? 'h-3.5' : 'h-3'} ${width}`} />
				))}
			</div>
			{tail}
		</div>
	)
}

/** Список из одинаковых строк: обёртку (скругление, разделители) передаёт экран. */
export function ListBone({
	className = '',
	count,
	row,
}: {
	className?: string
	count: number
	row: ReactNode
}) {
	return (
		<ul className={className}>
			{Array.from({ length: count }, (_, i) => (
				<li key={i}>{row}</li>
			))}
		</ul>
	)
}

/**
 * Высоты столбиков в процентах. Паттерн, а не `Math.random()`: случайные высоты
 * плясали бы на каждом рендере, и скелетон дёргался бы сам по себе поверх пульсации.
 */
const BAR_PATTERN = [52, 78, 41, 96, 63, 34, 71, 88, 47, 60, 82, 38, 67, 45, 90]

/** Силуэт столбчатого графика. Высоту области задаёт `className` — она у графиков разная. */
export function BarsBone({
	className = 'h-[140px]',
	count = 15,
	gap = 'gap-1',
}: {
	className?: string
	count?: number
	gap?: string
}) {
	return (
		<div aria-hidden className={`flex items-end ${gap} ${className}`}>
			{Array.from({ length: count }, (_, i) => (
				<div
					key={i}
					className={`${BONE} flex-1`}
					style={{ height: `${BAR_PATTERN[i % BAR_PATTERN.length]}%` }}
				/>
			))}
		</div>
	)
}

/** Лента одинаковых делений: аптайм по дням, доли в общей полосе. */
export function TrackBone({
	className = 'h-6',
	count = 90,
	gap = 'gap-px',
}: {
	className?: string
	count?: number
	gap?: string
}) {
	return (
		<div aria-hidden className={`flex ${gap} ${className}`}>
			{Array.from({ length: count }, (_, i) => (
				<div key={i} className={`${FILL} h-full flex-1 rounded-[1px]`} />
			))}
		</div>
	)
}

/**
 * Силуэт линейного графика: сетка и ломаная в том же `viewBox`, что у настоящего.
 * Столбики здесь соврали бы про форму — за этой костью рисуется линия скорости.
 */
export function LineBone({
	width = 640,
	height = 200,
	count = 15,
	className = '',
}: {
	width?: number
	height?: number
	count?: number
	className?: string
}) {
	const stepX = width / (count - 1)
	const points = Array.from({ length: count }, (_, i) => {
		const ratio = BAR_PATTERN[i % BAR_PATTERN.length]! / 100
		return `${(i * stepX).toFixed(1)},${(height - height * 0.8 * ratio - height * 0.1).toFixed(1)}`
	})

	return (
		<svg
			aria-hidden
			viewBox={`0 0 ${width} ${height}`}
			className={`w-full animate-pulse text-muted ${className}`}
		>
			{[0.25, 0.5, 0.75].map((y) => (
				<line
					key={y}
					x1={0}
					x2={width}
					y1={height * y}
					y2={height * y}
					stroke="currentColor"
					strokeWidth={1}
				/>
			))}
			<polyline
				points={points.join(' ')}
				fill="none"
				stroke="currentColor"
				strokeWidth={6}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}
