import type { ReactNode } from 'react'
import './Card.scss'

interface CardProps {
  /** Titre de la carte, rendu en <h2>. */
  title?: string
  children: ReactNode
}

/** Cadre blanc. Avec un titre, le contenu est empilé avec un petit espacement. */
export function Card({ title, children }: CardProps) {
  return (
    <section className="card">
      {title && <h2>{title}</h2>}
      {children}
    </section>
  )
}
