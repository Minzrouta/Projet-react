import type { ReactNode } from 'react'
import './Alert.scss'

interface AlertProps {
  tone?: 'info' | 'success' | 'warning' | 'error'
  children: ReactNode
}

/** Message dans le flux de la page. En ton `error` il est annoncé aussitôt par les lecteurs d'écran. */
export function Alert({ tone = 'info', children }: AlertProps) {
  return (
    <div className={`alert alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  )
}
