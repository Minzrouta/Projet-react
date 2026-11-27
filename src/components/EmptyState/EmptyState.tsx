import type { ReactNode } from 'react'
import './EmptyState.scss'

interface EmptyStateProps {
  children: ReactNode
  /** Bouton ou lien qui permet de sortir de l'état vide. */
  action?: ReactNode
}

export function EmptyState({ children, action }: EmptyStateProps) {
  return (
    <div className="empty">
      <p>{children}</p>
      {action}
    </div>
  )
}
