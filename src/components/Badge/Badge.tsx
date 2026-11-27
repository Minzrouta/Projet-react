import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'
import './Badge.scss'

export type BadgeTone = 'neutral' | 'accent' | 'info' | 'success' | 'warning' | 'danger'

interface BadgeProps {
  tone?: BadgeTone
  children: ReactNode
}

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return <span className={cx('badge', tone !== 'neutral' && `badge--${tone}`)}>{children}</span>
}
