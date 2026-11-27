import { useEffect, useState } from 'react'
import type { ApiError } from '../../lib/api'
import { Alert } from '../Alert'
import { Button } from '../Button'
import './ErrorState.scss'

interface ErrorStateProps {
  error: ApiError
  /** Relance le chargement. Sans cette prop, aucun bouton n'est proposé. */
  onRetry?: () => void
}

/** Erreur de chargement, avec réessai. Respecte le délai Retry-After des réponses 429 et 503. */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const [wait, setWait] = useState(error.retryAfter ?? 0)

  useEffect(() => {
    if (wait <= 0) return
    const id = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(id)
  }, [wait])

  return (
    <Alert tone="error">
      <div className="error-state">
        <span>{error.message}</span>
        {onRetry && (
          <Button size="small" onClick={onRetry} disabled={wait > 0}>
            {wait > 0 ? `Réessayer dans ${wait} s` : 'Réessayer'}
          </Button>
        )}
      </div>
    </Alert>
  )
}
