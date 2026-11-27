import { cx } from '../../lib/cx'
import './ProgressBar.scss'

interface ProgressBarProps {
  /** Ce que mesure la barre, lu par les lecteurs d'écran. */
  label: string
  value: number
  max: number
  tone?: 'accent' | 'success' | 'danger'
  thick?: boolean
}

/** Barre de progression native : la largeur vient des attributs value / max, sans style en ligne. */
export function ProgressBar({ label, value, max, tone = 'accent', thick = false }: ProgressBarProps) {
  return <progress className={cx('progress', tone !== 'accent' && `progress--${tone}`, thick && 'progress--thick')} aria-label={label} value={Math.min(value, max)} max={max} />
}
