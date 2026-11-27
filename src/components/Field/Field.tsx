import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import { cx } from '../../lib/cx'
import './Field.scss'

interface FieldProps {
  label: string
  /** Aide affichée sous le champ. */
  hint?: string
  /** Message d'erreur : le champ est alors marqué invalide et le message annoncé. */
  error?: string
  /** Masque le libellé à l'écran (il reste lu par les lecteurs d'écran), pour les champs d'un tableau. */
  hideLabel?: boolean
  /** Champ étroit aligné à droite, pour les montants et quantités. */
  numeric?: boolean
}

interface Wiring {
  'aria-describedby': string | undefined
  'aria-invalid': true | undefined
}

/** Libellé, champ, aide et erreur. Le <label> enveloppe le champ, l'aide et l'erreur lui sont reliées par aria-describedby. */
function FieldShell({ label, hint, error, hideLabel, numeric, children }: FieldProps & { children: (wiring: Wiring) => ReactNode }) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  return (
    <div className={cx('field', numeric && 'field--numeric')}>
      <label>
        <span className={cx(hideLabel && 'visually-hidden')}>{label}</span>
        {children({ 'aria-describedby': cx(hintId, errorId) || undefined, 'aria-invalid': error ? true : undefined })}
      </label>
      {hint && (
        <span id={hintId} className="field__hint">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} className="field__error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

type TextFieldProps = FieldProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'style'>

export function TextField({ label, hint, error, hideLabel, numeric, ...input }: TextFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} hideLabel={hideLabel} numeric={numeric}>
      {(wiring) => <input {...input} {...wiring} />}
    </FieldShell>
  )
}

type SelectFieldProps = FieldProps & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'style'>

export function SelectField({ label, hint, error, hideLabel, numeric, children, ...select }: SelectFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} hideLabel={hideLabel} numeric={numeric}>
      {(wiring) => (
        <select {...select} {...wiring}>
          {children}
        </select>
      )}
    </FieldShell>
  )
}

type CheckboxFieldProps = Pick<FieldProps, 'label' | 'hint'> & Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'style' | 'type'>

export function CheckboxField({ label, hint, ...input }: CheckboxFieldProps) {
  const hintId = useId()
  return (
    <div className="field">
      <label className="field__inline">
        <input type="checkbox" aria-describedby={hint ? hintId : undefined} {...input} />
        {label}
      </label>
      {hint && (
        <span id={hintId} className="field__hint">
          {hint}
        </span>
      )}
    </div>
  )
}
