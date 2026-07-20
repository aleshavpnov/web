import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
	return <AccordionPrimitive.Root data-slot="accordion" className={cn(className)} {...props} />
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
	return (
		<AccordionPrimitive.Item
			data-slot="accordion-item"
			className={cn('border-b border-border last:border-b-0', className)}
			{...props}
		/>
	)
}

function AccordionTrigger({ className, children, ...props }: AccordionPrimitive.Trigger.Props) {
	return (
		<AccordionPrimitive.Header data-slot="accordion-header" className="flex">
			<AccordionPrimitive.Trigger
				data-slot="accordion-trigger"
				className={cn(
					'group flex flex-1 items-center justify-between gap-3 rounded-md py-4 text-left text-sm font-medium text-foreground transition-colors',
					'hover:text-emerald-500 data-panel-open:text-emerald-500',
					'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
					className,
				)}
				{...props}
			>
				{children}
				<ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-panel-open:rotate-180" />
			</AccordionPrimitive.Trigger>
		</AccordionPrimitive.Header>
	)
}

function AccordionContent({ className, children, ...props }: AccordionPrimitive.Panel.Props) {
	return (
		<AccordionPrimitive.Panel
			data-slot="accordion-content"
			className="h-(--accordion-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-starting-style:h-0 data-ending-style:h-0"
			{...props}
		>
			{/* Паддинг на внутреннем div: Panel меряет высоту и клипует overflow. */}
			<div className={cn('pb-4 text-sm text-muted-foreground leading-relaxed', className)}>
				{children}
			</div>
		</AccordionPrimitive.Panel>
	)
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
