import * as React from 'react'
import { Plus } from 'lucide-react'

interface Props {
  onClick: () => void
  offset?: 'normal' | 'raised'
  placement?: 'right' | 'center'
  className?: string
  noFixed?: boolean
}

export function FloatingActionButton({ onClick, offset = 'normal', placement = 'right', className = '', noFixed = false }: Props) {
  const bottomClass = offset === 'raised' ? 'bottom-24 md:bottom-6' : 'bottom-6'
  const horizontalClass = placement === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-6'
  return (
    // Comentário de Acessibilidade: botão com aria-label descritivo, tamanho grande e contraste alto
    <button
      aria-label="Adicionar ocorrência"
      className={`${noFixed ? '' : `fixed ${bottomClass} ${horizontalClass}`} inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary text-white shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/70 ${className}`}
      onClick={onClick}
    >
      <Plus aria-hidden="true" className="h-7 w-7" />
    </button>
  )
}