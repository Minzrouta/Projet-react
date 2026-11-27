import { useEffect } from 'react'

export const APP_NAME = 'Facturation & relances'

/** Titre de l'onglet tant que le composant est affiché ; l'ancien titre est rétabli au démontage. */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title
    document.title = `${title} · ${APP_NAME}`
    return () => {
      document.title = previous
    }
  }, [title])
}
