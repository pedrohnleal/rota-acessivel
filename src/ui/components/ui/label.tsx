import * as React from 'react'
import { Label as RadixLabel } from '@radix-ui/react-label'
import { cn } from '../../utils/cn'

export function Label({ className, ...props }: React.ComponentProps<typeof RadixLabel>) {
  return (
    // Comentário de Acessibilidade: associa rótulos via htmlFor para leitores de tela
    <RadixLabel className={cn('mb-1 block text-sm font-semibold text-neutral-900', className)} {...props} />
  )
}