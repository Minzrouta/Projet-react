// API bouchonnée du projet de départ : chaque fonction reproduit un endpoint du backend (mêmes DTO,
// mêmes règles métier, même format d'erreur). Aucun appel réseau, tout est en mémoire.
// L'application ne s'en sert plus qu'en mode `mock` (tests de bout en bout, démonstration hors ligne).
import {
  FAILURE_STATUSES,
  type Api, type ApiError, type InvoiceDto, type InvoiceRequest, type InvoiceStatus, type InvoiceSummary,
  type SimulationDto, type UserDto,
} from '../lib/api/types'
import { appRoles, invoices, sequences, users, type InvoiceRecord, type LineRecord, type MockUser } from './data'

const REMINDER_DAYS = [7, 15, 30]
const LATENCY_MS = { NORMAL: 0, LOW: 1000, MEDIUM: 10_000, HIGH: 60_000 }
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

let session: MockUser | null = null
const simulation: SimulationDto = { latency: 'NORMAL', failure: { mode: 'NONE', status: null, rate: 100 } }

// ---------- outillage ----------

function fail(status: number, code: string, message: string, fields?: Record<string, string>, retryAfter?: number): never {
  const error: ApiError = { status, code, message, path: '', ...(fields ? { fields } : {}), ...(retryAfter ? { retryAfter } : {}) }
  throw error
}
const notFound = (what: string): never => fail(404, 'NOT_FOUND', `${what} introuvable`)
const conflict = (code: string, message: string): never => fail(409, code, message)
const invalid = (field: string, message: string): never => fail(400, 'VALIDATION_ERROR', 'Données invalides', { [field]: message })

/** Tire une panne simulée, comme le SimulationFilter du backend. */
function simulatedFailure() {
  const { mode, status, rate } = simulation.failure
  if (mode === 'NONE' || Math.random() * 100 >= rate) return
  const code = mode === 'FIXED' && status ? status : FAILURE_STATUSES[Math.floor(Math.random() * FAILURE_STATUSES.length)]
  fail(code, 'SIMULATED_ERROR', `Erreur simulée (HTTP ${code}) : la simulation de pannes est active`, undefined, code === 429 || code === 503 ? 5 : undefined)
}

/**
 * Délai réseau simulé (150 à 400 ms) et copie profonde du résultat.
 * `scope` suit le périmètre de la simulation du backend : les pannes ne touchent que les routes
 * de l'application, la latence touche tout sauf /api/simulation.
 */
async function call<T>(path: string, fn: () => T, scope: 'app' | 'core' | 'simulation' = 'app'): Promise<T> {
  const latency = scope === 'simulation' ? 0 : LATENCY_MS[simulation.latency]
  await new Promise((resolve) => setTimeout(resolve, 150 + Math.floor(Math.random() * 250) + latency))
  try {
    if (scope === 'app') {
      currentUser()
      simulatedFailure()
    }
    const result = fn()
    return result === undefined ? result : (JSON.parse(JSON.stringify(result)) as T)
  } catch (e) {
    throw { ...(e as ApiError), path }
  }
}

const nowIso = () => new Date().toISOString()
const today = () => new Date().toISOString().slice(0, 10)

// ---------- session et utilisateurs ----------

function currentUser(): MockUser {
  return session ?? fail(401, 'UNAUTHORIZED', 'Authentification requise')
}
function requireAdmin() {
  if (currentUser().role !== 'ADMIN') fail(403, 'FORBIDDEN', 'Accès refusé')
}
const nameOf = (id: string) => users.find((u) => u.id === id)?.displayName ?? 'Utilisateur supprimé'
const toUserDto = ({ id, email, displayName, role, enabled }: MockUser): UserDto => ({ id, email, displayName, role, enabled })
const findUser = (id: string) => users.find((u) => u.id === id) ?? notFound('Utilisateur')

function validateUser(fields: { email: string; displayName: string; password?: string }, selfId?: string) {
  const errors: Record<string, string> = {}
  if (!EMAIL.test(fields.email)) errors.email = 'doit être une adresse e-mail valide'
  if (!fields.displayName.trim()) errors.displayName = 'ne doit pas être vide'
  if (fields.password !== undefined && (fields.password.length < 8 || fields.password.length > 100)) errors.password = 'la taille doit être comprise entre 8 et 100'
  if (Object.keys(errors).length) fail(400, 'VALIDATION_ERROR', 'Données invalides', errors)
  if (users.some((u) => u.id !== selfId && u.email === fields.email.trim().toLowerCase())) conflict('EMAIL_ALREADY_USED', 'Cette adresse e-mail est déjà utilisée')
}

/** Il doit toujours rester au moins un administrateur actif. */
function keepsAnAdmin(without: MockUser) {
  if (!users.some((u) => u !== without && u.role === 'ADMIN' && u.enabled)) conflict('LAST_ADMIN_REQUIRED', "L'application doit conserver au moins un administrateur actif")
}

// ---------- règles de facturation (identiques à InvoiceService) ----------

const eur = (cents: number) => cents / 100
const cents = (euros: number) => Math.round(euros * 100)
const isAccountant = () => {
  const me = currentUser()
  return me.role === 'ADMIN' || (appRoles[me.id] ?? []).includes('ACCOUNTANT')
}
const requireAccountant = () => {
  if (!isAccountant()) fail(403, 'FORBIDDEN', 'Réservé au service comptable (ACCOUNTANT)')
}
const findInvoice = (id: string) => invoices.find((i) => i.id === id) ?? notFound('Facture')

/** HT et TVA arrondis au centime par ligne. */
function lineTotals(l: LineRecord) {
  const ht = Math.round(l.quantity * l.unitPrice)
  const vat = Math.round((ht * l.vatRate) / 100)
  return { ht, vat, ttc: ht + vat }
}

function money(i: InvoiceRecord) {
  const totals = i.lines.map(lineTotals).reduce((s, t) => ({ ht: s.ht + t.ht, vat: s.vat + t.vat, ttc: s.ttc + t.ttc }), { ht: 0, vat: 0, ttc: 0 })
  const paid = i.payments.reduce((s, p) => s + p.amount, 0)
  const credited = i.credits.reduce((s, c) => s + c.amount, 0)
  return { ...totals, paid, credited, remaining: totals.ttc - paid - credited }
}

const daysOverdue = (i: InvoiceRecord) => Math.max(0, Math.floor((new Date(today()).getTime() - new Date(i.dueDate).getTime()) / 86_400_000))

function statusOf(i: InvoiceRecord): InvoiceStatus {
  if (!i.issuedAt) return 'DRAFT'
  const m = money(i)
  if (m.credited === m.ttc) return 'CANCELLED'
  if (m.remaining === 0) return 'PAID'
  if (i.dueDate < today()) return 'OVERDUE'
  return m.paid > 0 || m.credited > 0 ? 'PARTIALLY_PAID' : 'ISSUED'
}

/** Plus haut niveau atteint non encore envoyé, si la facture est en retard. */
function reminderDue(i: InvoiceRecord): number | null {
  if (statusOf(i) !== 'OVERDUE') return null
  const late = daysOverdue(i)
  for (let level = REMINDER_DAYS.length; level >= 1; level--) {
    if (late >= REMINDER_DAYS[level - 1]) return i.reminders.some((r) => r.level === level) ? null : level
  }
  return null
}

function next(prefix: string) {
  const key = `${prefix}-${new Date().getFullYear()}`
  sequences[key] = (sequences[key] ?? 0) + 1
  return `${key}-${String(sequences[key]).padStart(4, '0')}`
}

function summaryOf(i: InvoiceRecord): InvoiceSummary {
  const m = money(i)
  return {
    id: i.id, number: i.number, clientId: i.clientId, clientName: nameOf(i.clientId), status: statusOf(i),
    dueDate: i.dueDate, issuedAt: i.issuedAt, totalTtc: eur(m.ttc), remaining: eur(m.remaining),
  }
}

function detail(i: InvoiceRecord): InvoiceDto {
  const m = money(i)
  const acc = isAccountant()
  return {
    ...summaryOf(i),
    totalHt: eur(m.ht), totalVat: eur(m.vat), paid: eur(m.paid), credited: eur(m.credited),
    daysOverdue: i.issuedAt ? daysOverdue(i) : 0,
    lines: i.lines.map((l, position) => {
      const t = lineTotals(l)
      return { position, label: l.label, quantity: l.quantity, unitPrice: eur(l.unitPrice), vatRate: l.vatRate, totalHt: eur(t.ht), totalVat: eur(t.vat), totalTtc: eur(t.ttc) }
    }),
    payments: i.payments.map((p) => ({ ...p, amount: eur(p.amount) })),
    creditNotes: i.credits.map((c) => ({ ...c, amount: eur(c.amount) })),
    reminders: acc ? i.reminders.map((r) => ({ level: r.level, sentAt: r.sentAt, sentByName: nameOf(r.sentBy) })) : [],
    reminderDue: acc ? reminderDue(i) : null,
  }
}

function validate(req: InvoiceRequest) {
  const fields: Record<string, string> = {}
  if (!users.some((u) => u.id === req.clientId)) fields.clientId = 'client introuvable'
  if (!req.dueDate) fields.dueDate = 'ne doit pas être nul'
  if (!req.lines.length) fields.lines = 'au moins une ligne'
  req.lines.forEach((l, i) => {
    if (!l.label.trim()) fields[`lines[${i}].label`] = 'ne doit pas être vide'
    if (!(l.quantity >= 0.01)) fields[`lines[${i}].quantity`] = 'doit être supérieur ou égal à 0.01'
    if (!(l.unitPrice >= 0)) fields[`lines[${i}].unitPrice`] = 'doit être supérieur ou égal à 0.00'
    if (!(l.vatRate >= 0 && l.vatRate <= 100)) fields[`lines[${i}].vatRate`] = 'doit être compris entre 0 et 100'
  })
  if (Object.keys(fields).length) fail(400, 'VALIDATION_ERROR', 'Données invalides', fields)
}

const toLines = (req: InvoiceRequest): LineRecord[] =>
  req.lines.map((l) => ({ label: l.label.trim(), quantity: Math.round(l.quantity * 100) / 100, unitPrice: cents(l.unitPrice), vatRate: l.vatRate }))

function issuedInvoice(id: string) {
  const i = findInvoice(id)
  if (!i.issuedAt) conflict('INVOICE_NOT_ISSUED', "La facture n'est pas encore émise")
  return i
}

// ---------- endpoints ----------

export const mockApi: Api = {
  mode: 'mock',
  /** Uniquement pour la page Connexion : rappel des identifiants de démonstration. */
  demoAccounts: () => users.filter((u) => u.enabled && u.note).map(({ email, password, displayName, role, note }) => ({ email, password, displayName, role, note })),

  /** POST /api/auth/login */
  login: (email, password) =>
    call('/api/auth/login', () => {
      const user = users.find((u) => u.email === email.trim().toLowerCase() && u.password === password)
      if (!user) return fail(401, 'BAD_CREDENTIALS', 'Email ou mot de passe incorrect')
      if (!user.enabled) fail(403, 'ACCOUNT_DISABLED', 'Ce compte est désactivé')
      session = user
      return toUserDto(user)
    }, 'core'),
  restore: async () => null,
  logout() {
    session = null
  },
  onSessionExpired: () => undefined,

  /** GET /api/invoices/me/roles */
  myRoles: () => call('/api/invoices/me/roles', () => (isAccountant() ? ['ACCOUNTANT'] : [])),

  /** GET /api/invoices/clients */
  clients: () =>
    call('/api/invoices/clients', () =>
      users.filter((u) => u.enabled).map((u) => ({ id: u.id, displayName: u.displayName })).sort((a, b) => a.displayName.localeCompare(b.displayName)),
    ),

  /** GET /api/invoices?status=&clientId=&overdue= */
  listInvoices: ({ status, clientId, overdue } = {}) =>
    call('/api/invoices', () => {
      const me = currentUser()
      const visible = isAccountant() ? invoices : invoices.filter((i) => i.issuedAt && i.clientId === me.id)
      return [...visible]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .filter((i) => !clientId || i.clientId === clientId)
        .map(summaryOf)
        .filter((s) => !status || s.status === status)
        .filter((s) => overdue === undefined || (s.status === 'OVERDUE') === overdue)
    }),

  /** GET /api/invoices/{id} */
  getInvoice: (id) =>
    call(`/api/invoices/${id}`, () => {
      const i = findInvoice(id)
      if (!isAccountant() && (!i.issuedAt || i.clientId !== currentUser().id)) notFound('Facture')
      return detail(i)
    }),

  /** POST /api/invoices : ACCOUNTANT */
  createInvoice: (req) =>
    call('/api/invoices', () => {
      requireAccountant()
      validate(req)
      const i: InvoiceRecord = { id: crypto.randomUUID(), number: null, clientId: req.clientId, dueDate: req.dueDate, issuedAt: null, createdAt: nowIso(), lines: toLines(req), payments: [], credits: [], reminders: [] }
      invoices.push(i)
      return detail(i)
    }),

  /** PUT /api/invoices/{id} : ACCOUNTANT, brouillon uniquement */
  updateInvoice: (id, req) =>
    call(`/api/invoices/${id}`, () => {
      requireAccountant()
      const i = findInvoice(id)
      if (i.issuedAt) conflict('INVOICE_ISSUED', "Facture émise : elle n'est plus modifiable (corrigez-la par un avoir)")
      validate(req)
      Object.assign(i, { clientId: req.clientId, dueDate: req.dueDate, lines: toLines(req) })
      return detail(i)
    }),

  /** POST /api/invoices/{id}/issue : numéro FAC continu, sans trou */
  issueInvoice: (id) =>
    call(`/api/invoices/${id}/issue`, () => {
      requireAccountant()
      const i = findInvoice(id)
      if (i.issuedAt) conflict('INVOICE_ISSUED', 'Facture déjà émise')
      if (i.dueDate < today()) invalid('dueDate', "ne doit pas être passée à l'émission")
      Object.assign(i, { number: next('FAC'), issuedAt: nowIso() })
      return detail(i)
    }),

  /** POST /api/invoices/{id}/payments : paiements + avoirs ≤ TTC */
  addPayment: (id, { date, amount, method }) =>
    call(`/api/invoices/${id}/payments`, () => {
      requireAccountant()
      const i = issuedInvoice(id)
      if (!(amount >= 0.01)) invalid('amount', 'doit être supérieur ou égal à 0.01')
      if (!date) invalid('date', 'ne doit pas être nul')
      if (date > today()) invalid('date', 'ne doit pas être dans le futur')
      if (cents(amount) > money(i).remaining) conflict('OVERPAYMENT', `Le paiement dépasse le reste dû (${eur(money(i).remaining).toFixed(2)} €)`)
      i.payments.push({ id: crypto.randomUUID(), date, amount: cents(amount), method })
      return detail(i)
    }),

  /** POST /api/invoices/{id}/credit-notes : avoir ≤ reste dû */
  addCreditNote: (id, { amount, reason }) =>
    call(`/api/invoices/${id}/credit-notes`, () => {
      requireAccountant()
      const i = issuedInvoice(id)
      if (!(amount >= 0.01)) invalid('amount', 'doit être supérieur ou égal à 0.01')
      if (!reason.trim()) invalid('reason', 'ne doit pas être vide')
      if (cents(amount) > money(i).remaining) conflict('CREDIT_TOO_HIGH', `L'avoir dépasse le reste dû (${eur(money(i).remaining).toFixed(2)} €)`)
      i.credits.push({ id: crypto.randomUUID(), number: next('AVO'), amount: cents(amount), reason: reason.trim(), createdAt: nowIso() })
      return detail(i)
    }),

  /** POST /api/invoices/{id}/reminders : une relance par niveau */
  sendReminder: (id, level) =>
    call(`/api/invoices/${id}/reminders`, () => {
      requireAccountant()
      const i = issuedInvoice(id)
      if (!(level >= 1 && level <= 3)) invalid('level', 'doit être compris entre 1 et 3')
      if (money(i).remaining === 0) conflict('REMINDER_NOT_DUE', 'La facture est soldée')
      if (daysOverdue(i) < REMINDER_DAYS[level - 1]) conflict('REMINDER_NOT_DUE', `Relance de niveau ${level} possible à partir de J+${REMINDER_DAYS[level - 1]}`)
      if (i.reminders.some((r) => r.level === level)) conflict('REMINDER_ALREADY_SENT', `Relance de niveau ${level} déjà envoyée`)
      i.reminders.push({ level, sentAt: nowIso(), sentBy: currentUser().id })
      return detail(i)
    }),

  /** GET /api/invoices/reminders/due : ACCOUNTANT */
  remindersDue: () =>
    call('/api/invoices/reminders/due', () => {
      requireAccountant()
      return invoices
        .filter((i) => reminderDue(i) !== null)
        .map((i) => ({ invoiceId: i.id, number: i.number as string, clientName: nameOf(i.clientId), dueDate: i.dueDate, daysOverdue: daysOverdue(i), remaining: eur(money(i).remaining), level: reminderDue(i) as number }))
        .sort((a, b) => b.daysOverdue - a.daysOverdue)
    }),

  /** GET /api/invoices/stats?year= : ACCOUNTANT */
  stats: (year = new Date().getFullYear()) =>
    call('/api/invoices/stats', () => {
      requireAccountant()
      const issued = invoices.filter((i) => i.issuedAt)
      const ofYear = issued.filter((i) => new Date(i.issuedAt as string).getFullYear() === year)
      const overdue = issued.filter((i) => statusOf(i) === 'OVERDUE')
      return {
        year,
        invoiced: eur(ofYear.reduce((s, i) => s + money(i).ttc, 0)),
        credited: eur(ofYear.reduce((s, i) => s + money(i).credited, 0)),
        collected: eur(issued.flatMap((i) => i.payments).filter((p) => p.date.startsWith(`${year}-`)).reduce((s, p) => s + p.amount, 0)),
        outstanding: eur(issued.reduce((s, i) => s + money(i).remaining, 0)),
        overdueCount: overdue.length,
        overdueAmount: eur(overdue.reduce((s, i) => s + money(i).remaining, 0)),
      }
    }),

  // ---------- ADMIN : utilisateurs ----------

  /** GET /api/users?page=&size=&search= */
  listUsers: ({ page = 0, size = 20, search = '' } = {}) =>
    call('/api/users', () => {
      requireAdmin()
      const needle = search.trim().toLowerCase()
      const all = users.filter((u) => !needle || u.email.includes(needle) || u.displayName.toLowerCase().includes(needle)).sort((a, b) => a.displayName.localeCompare(b.displayName))
      return { content: all.slice(page * size, page * size + size).map(toUserDto), page, size, totalElements: all.length, totalPages: Math.ceil(all.length / size) }
    }, 'core'),

  /** GET /api/users/{id} */
  getUser: (id) =>
    call(`/api/users/${id}`, () => {
      requireAdmin()
      return toUserDto(findUser(id))
    }, 'core'),

  /** POST /api/users */
  createUser: (req) =>
    call('/api/users', () => {
      requireAdmin()
      validateUser(req)
      const user: MockUser = { id: crypto.randomUUID(), email: req.email.trim().toLowerCase(), password: req.password, displayName: req.displayName.trim(), role: req.role, enabled: true }
      users.push(user)
      return toUserDto(user)
    }, 'core'),

  /** PUT /api/users/{id} */
  updateUser: (id, req) =>
    call(`/api/users/${id}`, () => {
      requireAdmin()
      const user = findUser(id)
      validateUser(req, id)
      if (user.role === 'ADMIN' && user.enabled && (req.role !== 'ADMIN' || !req.enabled)) keepsAnAdmin(user)
      Object.assign(user, { email: req.email.trim().toLowerCase(), displayName: req.displayName.trim(), role: req.role, enabled: req.enabled })
      return toUserDto(user)
    }, 'core'),

  /** DELETE /api/users/{id} */
  deleteUser: (id) =>
    call(`/api/users/${id}`, () => {
      requireAdmin()
      const user = findUser(id)
      if (user.role === 'ADMIN' && user.enabled) keepsAnAdmin(user)
      users.splice(users.indexOf(user), 1)
      delete appRoles[id]
    }, 'core'),

  // ---------- ADMIN : rôles de l'application ----------

  /** GET /api/invoices/admin/roles */
  listRoles: () =>
    call('/api/invoices/admin/roles', () => {
      requireAdmin()
      return Object.entries(appRoles).flatMap(([userId, roles]) => roles.map((role) => ({ userId, displayName: nameOf(userId), role })))
    }),

  /** PUT /api/invoices/admin/roles/{userId} : idempotent */
  grantAccountant: (userId) =>
    call(`/api/invoices/admin/roles/${userId}`, () => {
      requireAdmin()
      findUser(userId)
      appRoles[userId] = ['ACCOUNTANT']
    }),

  /** DELETE /api/invoices/admin/roles/{userId}?role=ACCOUNTANT */
  revokeAccountant: (userId) =>
    call(`/api/invoices/admin/roles/${userId}`, () => {
      requireAdmin()
      if (!appRoles[userId]?.length) notFound('Rôle')
      delete appRoles[userId]
    }),

  // ---------- ADMIN : simulation ----------

  /** GET /api/simulation */
  getSimulation: () =>
    call('/api/simulation', () => {
      requireAdmin()
      return simulation
    }, 'simulation'),

  /** PUT /api/simulation/latency */
  setLatency: (level) =>
    call('/api/simulation/latency', () => {
      requireAdmin()
      simulation.latency = level
      return simulation
    }, 'simulation'),

  /** PUT /api/simulation/failure */
  setFailure: ({ mode, status, rate }) =>
    call('/api/simulation/failure', () => {
      requireAdmin()
      if (mode === 'FIXED' && !FAILURE_STATUSES.includes(status ?? 0)) invalid('status', 'obligatoire en FIXED, parmi les codes autorisés')
      if (rate !== undefined && !(rate >= 1 && rate <= 100)) invalid('rate', 'doit être compris entre 1 et 100')
      simulation.failure = { mode, status: mode === 'FIXED' ? (status as number) : null, rate: rate ?? 100 }
      return simulation
    }, 'simulation'),

  /** DELETE /api/simulation */
  resetSimulation: () =>
    call('/api/simulation', () => {
      requireAdmin()
      simulation.latency = 'NORMAL'
      simulation.failure = { mode: 'NONE', status: null, rate: 100 }
      return simulation
    }, 'simulation'),
}
