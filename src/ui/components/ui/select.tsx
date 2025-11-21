import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { cn } from '../../utils/cn'

export const Select = SelectPrimitive.Root
export const SelectValue = SelectPrimitive.Value
export const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof SelectPrimitive.Trigger>>(
  ({ className, ...props }, ref) => (
    // Comentário de Acessibilidade: Trigger com foco claro e tamanho 44px
    <SelectPrimitive.Trigger ref={ref} className={cn('inline-flex h-11 w-full items-center justify-between rounded-md border border-neutral-400 bg-white px-4 text-left text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary', className)} {...props} />
  )
)
SelectTrigger.displayName = 'SelectTrigger'

export const SelectContent = ({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Content>) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content position="popper" sideOffset={6} className={cn('z-[70] min-w-[220px] overflow-hidden rounded-md border border-neutral-400 bg-white shadow-xl', className)} {...props}>
      <SelectPrimitive.Viewport>
        {props.children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
)

export const SelectItem = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof SelectPrimitive.Item>>(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Item ref={ref} className={cn('cursor-pointer px-4 py-3 text-neutral-900 data-[highlighted]:bg-neutral-100', className)} {...props}>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
)
SelectItem.displayName = 'SelectItem'