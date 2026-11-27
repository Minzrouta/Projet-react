import { useState } from 'react'
import { toApiError, type ApiError } from '../lib/api'

/** Exécute une action asynchrone (envoi de formulaire, bouton) et suit son état. */
export function useAction() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  /** Renvoie le résultat, ou `undefined` si l'action a échoué (l'erreur est alors dans `error`). */
  async function run<T>(action: () => Promise<T>): Promise<T | undefined> {
    setPending(true)
    setError(null)
    try {
      return await action()
    } catch (e) {
      setError(toApiError(e))
      return undefined
    } finally {
      setPending(false)
    }
  }

  return { run, pending, error, clearError: () => setError(null) }
}
