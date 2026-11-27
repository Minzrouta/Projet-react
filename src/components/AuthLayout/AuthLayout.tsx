import type { ReactNode } from 'react'
import '../Card/Card.scss'
import './AuthLayout.scss'

interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
}

/** Page centrée des écrans hors connexion (login). */
export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <main className="login">
      <div className="login__card card">
        <h1 className="login__title">{title}</h1>
        {subtitle && <p className="login__subtitle">{subtitle}</p>}
        {children}
      </div>
    </main>
  )
}
