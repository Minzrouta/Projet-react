import { useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import './PageHeader.scss'

interface PageHeaderProps {
  title: string
  /** Complément affiché à côté du titre (un badge de statut par exemple). */
  adornment?: ReactNode
  subtitle?: ReactNode
  /** Lien de retour vers la page parente. */
  back?: { to: string; label: string }
  /** Boutons, liens ou filtres affichés à droite. */
  actions?: ReactNode
}

/** En-tête de page. Met à jour le titre de l'onglet et donne le focus au <h1> pour annoncer le changement de page. */
export function PageHeader({ title, adornment, subtitle, back, actions }: PageHeaderProps) {
  const heading = useRef<HTMLHeadingElement>(null)
  useDocumentTitle(title)

  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [])

  return (
    <>
      {back && (
        <Link to={back.to} className="back-link">
          <span aria-hidden="true">←</span> {back.label}
        </Link>
      )}
      <header className="page-header">
        <div>
          <h1 ref={heading} tabIndex={-1}>
            {title} {adornment}
          </h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions && <div className="page-header__actions">{actions}</div>}
      </header>
    </>
  )
}
