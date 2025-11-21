import * as React from 'react'
import { cn } from '../../utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    // Comentário de Acessibilidade: contraste alto de borda e foco, tamanho de toque 44px
    <input
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-md border border-neutral-400 bg-white px-4 text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'