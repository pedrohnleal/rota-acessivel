import * as React from 'react'
import { cn } from '../../utils/cn'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/70 disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-base',
    lg: 'h-12 px-5 text-lg'
  }
  const variants = {
    primary: 'bg-primary text-white hover:brightness-110',
    outline: 'border border-neutral-400 text-neutral-900 hover:bg-neutral-100',
    ghost: 'text-neutral-900 hover:bg-neutral-100'
  }

  return (
    // Comentário de Acessibilidade: usa foco visível com ring e hit area grande
    <button
      className={cn(base, sizes[size], variants[variant], className)}
      {...props}
    />
  )
}