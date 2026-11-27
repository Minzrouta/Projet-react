import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Button, type ButtonVariant } from '../Button'
import './ConfirmDialog.scss'

interface ConfirmDialogProps {
  open: boolean
  title: string
  /** Ce que l'action va faire, et pourquoi elle mérite une confirmation. */
  children: ReactNode
  confirmLabel: string
  confirmVariant?: ButtonVariant
  /** Action en cours : les boutons sont bloqués. */
  pending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Demande de confirmation avant une action irréversible. S'appuie sur <dialog> : focus piégé et Échap gérés par le navigateur. */
export function ConfirmDialog({ open, title, children, confirmLabel, confirmVariant = 'primary', pending = false, onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  // <dialog> est une API impérative du navigateur : on la synchronise avec la prop `open`.
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        if (!pending) onCancel()
      }}
    >
      <h2 id={titleId}>{title}</h2>
      <div className="confirm-dialog__body">{children}</div>
      <div className="confirm-dialog__actions">
        <Button onClick={onCancel} disabled={pending}>
          Annuler
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm} loading={pending}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}
