import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogPortal = DialogPrimitive.Portal
export const DialogClose = DialogPrimitive.Close

export function DialogContent({ className, children }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    // Comentário de Acessibilidade: Dialog do Radix já fornece aria-modal, role, foco inicial e trap
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50 pointer-events-none" />
      <DialogPrimitive.Content
        className={cn(
          'fixed inset-0 z-50 grid place-items-center p-4 pointer-events-none',
          className
        )}
      >
        <div className="relative w-[92vw] max-w-xl max-h-[85vh] overflow-y-auto rounded-lg bg-white p-4 shadow-2xl md:p-6 pointer-events-auto">
          <DialogPrimitive.Close asChild>
            <button
              aria-label="Fechar"
              className="absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </DialogPrimitive.Close>
          {children}
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}