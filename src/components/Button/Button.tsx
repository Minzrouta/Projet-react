import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cx } from '../../lib/cx'
import './Button.scss'

export type ButtonVariant = 'default' | 'primary' | 'danger' | 'ghost'
export type ButtonSize = 'medium' | 'small'

interface Appearance {
  variant?: ButtonVariant
  size?: ButtonSize
}

interface ButtonProps extends Appearance, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'style'> {
  /** Action en cours : le bouton est désactivé et annoncé comme occupé. */
  loading?: boolean
  children: ReactNode
}

const classes = ({ variant = 'default', size = 'medium' }: Appearance) =>
  cx('btn', variant !== 'default' && `btn--${variant}`, size === 'small' && 'btn--small')

export function Button({ variant, size, loading = false, disabled, children, type = 'button', ...rest }: ButtonProps) {
  return (
    <button type={type} className={classes({ variant, size })} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {children}
    </button>
  )
}

/** Un lien de navigation qui a l'apparence d'un bouton. */
export function ButtonLink({ variant, size, ...rest }: Appearance & Omit<LinkProps, 'className' | 'style'>) {
  return <Link className={classes({ variant, size })} {...rest} />
}
