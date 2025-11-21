import * as React from 'react'
import * as SheetPrimitive from '@radix-ui/react-dialog'
import { cn } from '../../utils/cn'

export const Sheet = SheetPrimitive.Root
export const SheetTrigger = SheetPrimitive.Trigger
export const SheetClose = SheetPrimitive.Close

type Side = 'left' | 'right' | 'top' | 'bottom'

export function SheetContent({ side = 'right', className, children, ...props }: React.ComponentProps<typeof SheetPrimitive.Content> & { side?: Side }) {
  const sideClasses: Record<Side, string> = {
    left: 'fixed inset-y-0 left-0 w-[90vw] max-w-md',
    right: 'fixed inset-y-0 right-0 w-[90vw] max-w-md',
    top: 'fixed inset-x-0 top-0 h-[85vh] max-h-[85vh]',
    bottom: 'fixed inset-x-0 bottom-0 h-[65vh] max-h-[70vh]'
  }
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 bg-black/50" />
      <SheetPrimitive.Content
        className={cn(
          sideClasses[side],
          'z-50 rounded-t-xl border border-neutral-300 bg-white p-4 pb-[env(safe-area-inset-bottom)] shadow-2xl focus:outline-none',
          className
        )}
        {...props}
      >
        {children}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}