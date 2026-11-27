import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { Badge } from '../Badge'
import { Button } from '../Button'
import './AppLayout.scss'

export interface NavItem {
  to: string
  label: string
}

interface AppLayoutProps {
  /** Nom de l'application, affiché à gauche de la barre. */
  brand: string
  nav: NavItem[]
  userName: string
  /** Affiche le badge « admin » à côté du nom. */
  admin?: boolean
  onLogout: () => void
  children: ReactNode
}

/** Cadre commun aux pages connectées : barre de navigation, utilisateur, contenu. */
export function AppLayout({ brand, nav, userName, admin = false, onLogout, children }: AppLayoutProps) {
  return (
    <div className="app">
      <a href="#contenu" className="app__skip">
        Aller au contenu
      </a>
      <header className="app-header">
        <div className="app-header__brand">{brand}</div>
        <nav className="app-header__nav" aria-label="Navigation principale">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="app-header__user">
          <span className="app-header__name">{userName}</span>
          {admin && <Badge tone="accent">admin</Badge>}
          <Button variant="ghost" size="small" onClick={onLogout}>
            Déconnexion
          </Button>
        </div>
      </header>
      <main id="contenu" className="app-main">
        {children}
      </main>
    </div>
  )
}
