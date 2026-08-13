import { Switch as SwitchPrimitive } from '@base-ui/react/switch'

import { cn } from '@/lib/utils'

/**
 * Переключатель «включено / выключено».
 *
 * Отличие от кнопки с подписью: состояние читается по положению, а не по слову, и тап по
 * нему не выглядит как «отправить». Дорожка ростом 28px при ширине 48 — тач-цель по
 * нижней границе комфортного (см. размеры кнопок в button.tsx).
 */
function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
	return (
		<SwitchPrimitive.Root
			data-slot="switch"
			className={cn(
				'relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full',
				'bg-muted transition-colors duration-200 outline-none',
				'data-checked:bg-brand',
				'focus-visible:ring-[3px] focus-visible:ring-ring/50',
				'disabled:cursor-not-allowed disabled:opacity-50',
				className,
			)}
			{...props}
		>
			<SwitchPrimitive.Thumb
				data-slot="switch-thumb"
				className={cn(
					'block size-6 rounded-full bg-background shadow-sm ring-1 ring-foreground/10',
					'translate-x-0.5 transition-transform duration-200 data-checked:translate-x-[1.375rem]',
				)}
			/>
		</SwitchPrimitive.Root>
	)
}

export { Switch }
