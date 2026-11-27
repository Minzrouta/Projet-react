import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'
import './Text.scss'

interface TextProps {
  tone?: 'default' | 'muted' | 'danger' | 'success'
  size?: 'medium' | 'small'
  strong?: boolean
  /** Balise rendue : `p` pour un paragraphe, `span` dans une phrase ou une cellule. */
  as?: 'p' | 'span'
  children: ReactNode
}

/** Variation typographique d'un texte : discret, petit, gras, coloré. */
export function Text({ tone = 'default', size = 'medium', strong = false, as: Tag = 'span', children }: TextProps) {
  return <Tag className={cx(tone === 'muted' && 'muted', tone === 'danger' && 'danger-text', tone === 'success' && 'success-text', size === 'small' && 'small', strong && 'strong') || undefined}>{children}</Tag>
}
