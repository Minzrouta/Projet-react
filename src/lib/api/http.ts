// Client HTTP de l'API Spring Boot. Les appels passent par /api (proxy Vite en dev, nginx en prod),
// donc même origine : pas de CORS à configurer.
import type { Api, ApiError, InvoiceDto, SimulationDto, UserDto } from './types'

interface TokenResponse {
  accessToken: string
  refreshToken: string
  user: UserDto
}

// La simulation de latence peut aller jusqu'à 60 s : on coupe un peu après.
const TIMEOUT_MS = 70_000
const REFRESH_KEY = 'facturation.refresh'

// Le jeton d'accès reste en mémoire. Seul le jeton de rafraîchissement survit au rechargement,
// dans sessionStorage (limité à l'onglet).
let accessToken: string | null = null
let sessionExpired: () => void = () => undefined
let refreshing: Promise<boolean> | null = null

function networkError(path: string, timedOut: boolean): ApiError {
  return timedOut
    ? { status: 0, code: 'TIMEOUT', message: "Le serveur met trop de temps à répondre.", path }
    : { status: 0, code: 'NETWORK_ERROR', message: 'Serveur injoignable. Vérifiez votre connexion.', path }
}

async function send(method: string, path: string, body?: unknown, auth = true): Promise<Response> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`
  const signal = AbortSignal.timeout(TIMEOUT_MS)
  try {
    return await fetch(path, { method, headers, signal, body: body === undefined ? undefined : JSON.stringify(body) })
  } catch (e) {
    throw networkError(path, e instanceof DOMException && e.name === 'TimeoutError')
  }
}

async function readError(res: Response, path: string): Promise<ApiError> {
  const retry = Number(res.headers.get('Retry-After'))
  const base: ApiError = { status: res.status, code: 'HTTP_ERROR', message: `Erreur ${res.status}`, path }
  try {
    const json = (await res.json()) as Partial<ApiError>
    Object.assign(base, { code: json.code ?? base.code, message: json.message ?? base.message, fields: json.fields ?? undefined })
  } catch {
    // corps absent ou non JSON (502 d'un proxy par exemple) : on garde le message générique
  }
  if (retry > 0) base.retryAfter = retry
  return base
}

function setSession(tokens: TokenResponse): UserDto {
  accessToken = tokens.accessToken
  sessionStorage.setItem(REFRESH_KEY, tokens.refreshToken)
  return tokens.user
}

function clearSession() {
  accessToken = null
  sessionStorage.removeItem(REFRESH_KEY)
}

/** Un seul rafraîchissement à la fois, même si plusieurs requêtes reçoivent un 401 en même temps. */
function refresh(): Promise<boolean> {
  refreshing ??= (async () => {
    const refreshToken = sessionStorage.getItem(REFRESH_KEY)
    if (!refreshToken) return false
    const res = await send('POST', '/api/auth/refresh', { refreshToken }, false)
    if (!res.ok) return false
    setSession((await res.json()) as TokenResponse)
    return true
  })().finally(() => {
    refreshing = null
  })
  return refreshing
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res = await send(method, path, body)
  // 401 réel (pas une panne simulée) : le jeton d'accès a expiré, on tente de le renouveler une fois.
  if (res.status === 401 && !res.headers.has('X-Simulated-Failure')) {
    if (await refresh()) {
      res = await send(method, path, body)
    } else {
      clearSession()
      sessionExpired()
    }
  }
  if (!res.ok) throw await readError(res, path)
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}

const get = <T>(path: string) => request<T>('GET', path)

function query(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) if (value !== undefined) search.set(key, String(value))
  const text = search.toString()
  return text ? `?${text}` : ''
}

export const httpApi: Api = {
  mode: 'http',
  demoAccounts: () => [],

  async login(email, password) {
    const res = await send('POST', '/api/auth/login', { email, password }, false)
    if (!res.ok) throw await readError(res, '/api/auth/login')
    return setSession((await res.json()) as TokenResponse)
  },
  async restore() {
    if (!(await refresh().catch(() => false))) return null
    return get<UserDto>('/api/auth/me')
  },
  logout: clearSession,
  onSessionExpired(listener) {
    sessionExpired = listener
  },

  myRoles: () => get('/api/invoices/me/roles'),
  clients: () => get('/api/invoices/clients'),
  listInvoices: (filters = {}) => get(`/api/invoices${query({ ...filters })}`),
  getInvoice: (id) => get(`/api/invoices/${id}`),
  createInvoice: (req) => request('POST', '/api/invoices', req),
  updateInvoice: (id, req) => request('PUT', `/api/invoices/${id}`, req),
  issueInvoice: (id) => request('POST', `/api/invoices/${id}/issue`),
  addPayment: (id, req) => request<InvoiceDto>('POST', `/api/invoices/${id}/payments`, req),
  addCreditNote: (id, req) => request<InvoiceDto>('POST', `/api/invoices/${id}/credit-notes`, req),
  sendReminder: (id, level) => request<InvoiceDto>('POST', `/api/invoices/${id}/reminders`, { level }),
  remindersDue: () => get('/api/invoices/reminders/due'),
  stats: (year) => get(`/api/invoices/stats${query({ year })}`),

  listUsers: (params = {}) => get(`/api/users${query({ ...params })}`),
  getUser: (id) => get(`/api/users/${id}`),
  createUser: (req) => request('POST', '/api/users', req),
  updateUser: (id, req) => request('PUT', `/api/users/${id}`, req),
  deleteUser: (id) => request('DELETE', `/api/users/${id}`),
  listRoles: () => get('/api/invoices/admin/roles'),
  grantAccountant: async (userId) => {
    await request('PUT', `/api/invoices/admin/roles/${userId}`, { role: 'ACCOUNTANT' })
  },
  revokeAccountant: (userId) => request('DELETE', `/api/invoices/admin/roles/${userId}?role=ACCOUNTANT`),
  getSimulation: () => get('/api/simulation'),
  setLatency: (level) => request<SimulationDto>('PUT', '/api/simulation/latency', { level }),
  setFailure: (req) => request<SimulationDto>('PUT', '/api/simulation/failure', req),
  resetSimulation: () => request<SimulationDto>('DELETE', '/api/simulation'),
}
