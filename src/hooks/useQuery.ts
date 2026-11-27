import { useCallback, useEffect, useRef, useState } from 'react'
import { toApiError, type ApiError } from '../lib/api'

interface QueryState<T> {
  key: string
  data: T | null
  error: ApiError | null
}

export interface Query<T> {
  data: T | null
  error: ApiError | null
  loading: boolean
  reload: () => void
  /** Remplace la donnée sans rappeler l'API (après une action qui renvoie la ressource à jour). */
  setData: (data: T) => void
}

/**
 * Charge une donnée et expose ses trois états : chargement, erreur, donnée.
 * `key` identifie la requête : quand elle change, on recharge. Le cleanup ignore la réponse
 * d'une requête dépassée, pour qu'une réponse lente n'écrase jamais une plus récente.
 */
export function useQuery<T>(key: string, fetcher: () => Promise<T>): Query<T> {
  const [state, setState] = useState<QueryState<T>>({ key, data: null, error: null })
  const [loadedTick, setLoadedTick] = useState(-1)
  const [tick, setTick] = useState(0)
  const fetcherRef = useRef(fetcher)

  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    let ignore = false
    fetcherRef
      .current()
      .then((data) => {
        if (!ignore) setState({ key, data, error: null })
      })
      .catch((e: unknown) => {
        if (!ignore) setState((s) => ({ key, data: s.key === key ? s.data : null, error: toApiError(e) }))
      })
      .finally(() => {
        if (!ignore) setLoadedTick(tick)
      })
    return () => {
      ignore = true
    }
  }, [key, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  const setData = useCallback((data: T) => setState({ key, data, error: null }), [key])

  // Une donnée chargée pour une autre clé n'est pas affichée : dérivé pendant le rendu, pas d'effet.
  const current = state.key === key
  const loading = !current || loadedTick !== tick
  return {
    data: current ? state.data : null,
    error: current && !loading ? state.error : null,
    loading,
    reload,
    setData,
  }
}
