import { httpApi } from './http'
import type { Api } from './types'

// L'application appelle l'API Spring Boot. Le mode `mock` (npm run dev:mock) la remplace par le
// bouchon en mémoire du projet de départ : il sert aux tests de bout en bout et à la démo hors ligne.
// L'import dynamique garde le bouchon et ses comptes de démonstration hors du build de production.
export const api: Api = import.meta.env.VITE_API_MODE === 'mock' ? (await import('../../mocks/api')).mockApi : httpApi

export * from './types'
