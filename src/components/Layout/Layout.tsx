import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'
import './Layout.scss'

// Composants de mise en page : les pages les assemblent et n'écrivent ainsi aucun CSS.

interface StackProps {
  /** Espacement vertical entre les éléments. */
  gap?: 'small' | 'medium' | 'large'
  children: ReactNode
}

/** Empile ses enfants verticalement. */
export function Stack({ gap = 'medium', children }: StackProps) {
  return <div className={cx('stack', gap !== 'medium' && `stack--${gap}`)}>{children}</div>
}

interface RowProps {
  justify?: 'start' | 'between' | 'end'
  /** Aligne les éléments sur leur bord bas (un champ avec libellé à côté d'un bouton). */
  align?: 'center' | 'end'
  /** Garde les éléments sur une seule ligne (actions d'une ligne de tableau). */
  nowrap?: boolean
  children: ReactNode
}

/** Aligne ses enfants sur une ligne, avec retour à la ligne si la place manque. */
export function Row({ justify = 'start', align = 'center', nowrap = false, children }: RowProps) {
  return <div className={cx('row', justify !== 'start' && `row--${justify}`, align === 'end' && 'row--bottom', nowrap && 'row--nowrap')}>{children}</div>
}

interface GridProps {
  /** `2` : deux colonnes égales (une seule sur mobile). `auto` : autant de colonnes que la largeur le permet. */
  columns?: 2 | 'auto'
  children: ReactNode
}

export function Grid({ columns = 'auto', children }: GridProps) {
  return <div className={cx('grid', columns === 2 && 'grid--2')}>{children}</div>
}

interface ContainerProps {
  children: ReactNode
}

/** Limite la largeur du contenu pour les pages de formulaire. */
export function Narrow({ children }: ContainerProps) {
  return <div className="narrow-page">{children}</div>
}

/** Contenu masqué à l'impression (formulaires, actions). */
export function ScreenOnly({ children }: ContainerProps) {
  return <div className="screen-only">{children}</div>
}
