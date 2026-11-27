// Appels bouchonnés : chaque fonction reproduit un endpoint du backend (même route, mêmes DTO,
// mêmes règles métier, même format d'erreur). Aucun appel réseau : tout est en mémoire.
import { users, type MockUser } from './data'

// ---------- types communs ----------

export type Role = 'ADMIN' | 'USER'

export interface UserDto {
  id: string
  email: string
  displayName: string
  role: Role
  enabled: boolean
}

export interface UserSummary {
  id: string
  displayName: string
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: UserDto
}

/** Format d'erreur unique de l'API (§4.5). */
export interface ApiError {
  timestamp: string
  status: number
  code: string
  message: string
  path: string
  fields?: Record<string, string>
}

export interface Page<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface DemoAccount {
  email: string
  password: string
  displayName: string
  role: Role
  note?: string
}

// ---------- outillage du bouchon ----------

class Failure {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly message: string,
    readonly fields?: Record<string, string>,
  ) {}
}

function fail(status: number, code: string, message: string, fields?: Record<string, string>): never {
  throw new Failure(status, code, message, fields)
}

const notFound = (what: string): never => fail(404, 'NOT_FOUND', `${what} introuvable`)
const forbidden = (message: string): never => fail(403, 'FORBIDDEN', message)
const conflict = (code: string, message: string): never => fail(409, code, message)
const invalid = (field: string, message: string): never =>
  fail(400, 'VALIDATION_ERROR', 'Données invalides', { [field]: message })

/** Délai simulé (200 à 500 ms), copie profonde du résultat, conversion des erreurs au format de l'API. */
async function call<T>(path: string, fn: () => T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, 200 + Math.floor(Math.random() * 300)))
  try {
    const result = fn()
    return result === undefined ? result : (JSON.parse(JSON.stringify(result)) as T)
  } catch (e) {
    if (e instanceof Failure) {
      const error: ApiError = {
        timestamp: new Date().toISOString(),
        status: e.status,
        code: e.code,
        message: e.message,
        path,
        ...(e.fields ? { fields: e.fields } : {}),
      }
      throw error
    }
    throw e
  }
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function paginate<T>(all: T[], page = 0, size = 20): Page<T> {
  const safeSize = Math.max(1, Math.min(size, 100))
  const safePage = Math.max(0, page)
  return {
    content: all.slice(safePage * safeSize, safePage * safeSize + safeSize),
    page: safePage,
    size: safeSize,
    totalElements: all.length,
    totalPages: Math.ceil(all.length / safeSize),
  }
}

const nowIso = () => new Date().toISOString()
const todayIso = () => toIsoDate(new Date())

function toIsoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00`)
  d.setDate(d.getDate() + days)
  return toIsoDate(d)
}

// ---------- session et utilisateurs ----------

let session: MockUser | null = null

function currentUser(): MockUser {
  if (!session) fail(401, 'UNAUTHORIZED', 'Authentification requise')
  return session as MockUser
}

function requireAdmin(): MockUser {
  const me = currentUser()
  if (me.role !== 'ADMIN') forbidden('Action réservée aux administrateurs')
  return me
}

const isAdmin = (u: MockUser) => u.role === 'ADMIN'

function nameOf(id: string): string {
  return users.find((u) => u.id === id)?.displayName ?? 'Utilisateur supprimé'
}

function summary(id: string): UserSummary {
  return { id, displayName: nameOf(id) }
}

function toUserDto(u: MockUser): UserDto {
  return { id: u.id, email: u.email, displayName: u.displayName, role: u.role, enabled: u.enabled }
}

/** POST /api/auth/login */
function login(email: string, password: string): Promise<TokenResponse> {
  return call('/api/auth/login', () => {
    const user = users.find((u) => u.email === email.trim().toLowerCase() && u.password === password)
    if (!user) fail(401, 'BAD_CREDENTIALS', 'Email ou mot de passe incorrect')
    const u = user as MockUser
    if (!u.enabled) fail(403, 'ACCOUNT_DISABLED', 'Ce compte est désactivé')
    session = u
    return { accessToken: `mock-access-${u.id}`, refreshToken: `mock-refresh-${u.id}`, expiresIn: 900, user: toUserDto(u) }
  })
}

/** GET /api/auth/me */
function me(): Promise<UserDto> {
  return call('/api/auth/me', () => toUserDto(currentUser()))
}

function logout(): void {
  session = null
}

/** Uniquement pour la page Connexion : rappel des identifiants de démonstration. */
function demoAccounts(): DemoAccount[] {
  return users
    .filter((u) => u.enabled)
    .map((u) => ({ email: u.email, password: u.password, displayName: u.displayName, role: u.role, note: u.note }))
}

const authApi = { login, me, logout, demoAccounts }

// Les déclarations ci-dessous peuvent ne pas toutes servir dans chaque application.
void notFound; void forbidden; void conflict; void invalid; void paginate; void nowIso; void todayIso
void addDays; void requireAdmin; void isAdmin; void nameOf; void summary; void uuid

// ======================================================================
// API de l'application
// ======================================================================
import { appRoles, invoices, sequences, type InvoiceRecord, type LineRecord, type PaymentMethod } from './data'

export type { PaymentMethod } from './data'
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED'

export interface LineRequest { label: string; quantity: number; unitPrice: number; vatRate: number }
export interface InvoiceRequest { clientId: string; lines: LineRequest[]; dueDate: string }
export interface LineDto extends LineRequest { position: number; totalHt: number; totalVat: number; totalTtc: number }
export interface InvoiceSummary { id: string; number: string | null; clientId: string; clientName: string; status: InvoiceStatus; dueDate: string; issuedAt: string | null; totalTtc: number; remaining: number }
export interface InvoiceDto extends InvoiceSummary {
  lines: LineDto[]; totalHt: number; totalVat: number; paid: number; credited: number; daysOverdue: number
  payments: { id: string; date: string; amount: number; method: PaymentMethod }[]
  creditNotes: { id: string; number: string; amount: number; reason: string; createdAt: string }[]
  reminders: { level: number; sentAt: string; sentByName: string }[]
  reminderDue: number | null
}
export interface ReminderDueDto { invoiceId: string; number: string; clientName: string; dueDate: string; daysOverdue: number; remaining: number; level: number }
export interface StatsDto { year: number; invoiced: number; credited: number; collected: number; outstanding: number; overdueCount: number; overdueAmount: number }

const REMINDER_DAYS = [7, 15, 30]

// ---------- règles (identiques à InvoiceService) ----------

const eur = (cents: number) => cents / 100
const cents = (euros: number) => Math.round(euros * 100)
const today = () => new Date().toISOString().slice(0, 10)
const isAccountant = () => {
  const me = currentUser()
  return isAdmin(me) || (appRoles[me.id] ?? []).includes('ACCOUNTANT')
}
const requireAccountant = () => !isAccountant() && forbidden('Réservé au service comptable (ACCOUNTANT)')
const findInvoice = (id: string) => invoices.find((i) => i.id === id) ?? notFound('Facture')

/** HT et TVA arrondis au centime par ligne. */
const lineTotals = (l: LineRecord) => {
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

function status(i: InvoiceRecord): InvoiceStatus {
  if (!i.issuedAt) return 'DRAFT'
  const m = money(i)
  if (m.credited === m.ttc) return 'CANCELLED'
  if (m.remaining === 0) return 'PAID'
  if (i.dueDate < today()) return 'OVERDUE'
  return m.paid > 0 || m.credited > 0 ? 'PARTIALLY_PAID' : 'ISSUED'
}

/** Plus haut niveau atteint non encore envoyé, si la facture est en retard. */
function reminderDue(i: InvoiceRecord): number | null {
  if (status(i) !== 'OVERDUE') return null
  const late = daysOverdue(i)
  for (let level = REMINDER_DAYS.length; level >= 1; level--) if (late >= REMINDER_DAYS[level - 1]) return i.reminders.some((r) => r.level === level) ? null : level
  return null
}

function next(prefix: string) {
  const key = `${prefix}-${new Date().getFullYear()}`
  sequences[key] = (sequences[key] ?? 0) + 1
  return `${key}-${String(sequences[key]).padStart(4, '0')}`
}

function summaryOf(i: InvoiceRecord): InvoiceSummary {
  const m = money(i)
  return { id: i.id, number: i.number, clientId: i.clientId, clientName: nameOf(i.clientId), status: status(i), dueDate: i.dueDate, issuedAt: i.issuedAt, totalTtc: eur(m.ttc), remaining: eur(m.remaining) }
}

function detail(i: InvoiceRecord): InvoiceDto {
  const m = money(i)
  const acc = isAccountant()
  return {
    ...summaryOf(i), totalHt: eur(m.ht), totalVat: eur(m.vat), paid: eur(m.paid), credited: eur(m.credited), daysOverdue: i.issuedAt ? daysOverdue(i) : 0,
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

const toLines = (req: InvoiceRequest): LineRecord[] => req.lines.map((l) => ({ label: l.label.trim(), quantity: Math.round(l.quantity * 100) / 100, unitPrice: cents(l.unitPrice), vatRate: l.vatRate }))

function issuedInvoice(id: string) {
  const i = findInvoice(id)
  if (!i.issuedAt) conflict('INVOICE_NOT_ISSUED', "La facture n'est pas encore émise")
  return i
}

// ---------- endpoints ----------

/** GET /api/invoices/me/roles */
function myRoles(): Promise<string[]> {
  return call('/api/invoices/me/roles', () => (isAccountant() ? ['ACCOUNTANT'] : []))
}

/** POST /api/invoices — ACCOUNTANT */
function create(req: InvoiceRequest): Promise<InvoiceDto> {
  return call('/api/invoices', () => {
    requireAccountant()
    validate(req)
    const i: InvoiceRecord = { id: uuid(), number: null, clientId: req.clientId, dueDate: req.dueDate, issuedAt: null, createdAt: nowIso(), lines: toLines(req), payments: [], credits: [], reminders: [] }
    invoices.push(i)
    return detail(i)
  })
}

/** PUT /api/invoices/{id} — ACCOUNTANT, brouillon uniquement */
function update(id: string, req: InvoiceRequest): Promise<InvoiceDto> {
  return call(`/api/invoices/${id}`, () => {
    requireAccountant()
    const i = findInvoice(id)
    if (i.issuedAt) conflict('INVOICE_ISSUED', "Facture émise : elle n'est plus modifiable (corrigez-la par un avoir)")
    validate(req)
    Object.assign(i, { clientId: req.clientId, dueDate: req.dueDate, lines: toLines(req) })
    return detail(i)
  })
}

/** POST /api/invoices/{id}/issue — numéro FAC continu, sans trou */
function issue(id: string): Promise<InvoiceDto> {
  return call(`/api/invoices/${id}/issue`, () => {
    requireAccountant()
    const i = findInvoice(id)
    if (i.issuedAt) conflict('INVOICE_ISSUED', 'Facture déjà émise')
    if (i.dueDate < today()) invalid('dueDate', "ne doit pas être passée à l'émission")
    Object.assign(i, { number: next('FAC'), issuedAt: nowIso() })
    return detail(i)
  })
}

/** GET /api/invoices?status=&clientId=&overdue= */
function list(filterStatus?: InvoiceStatus, clientId?: string, overdue?: boolean): Promise<InvoiceSummary[]> {
  return call('/api/invoices', () => {
    const me = currentUser()
    const visible = isAccountant() ? invoices : invoices.filter((i) => i.issuedAt && i.clientId === me.id)
    return [...visible].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).filter((i) => !clientId || i.clientId === clientId).map(summaryOf)
      .filter((s) => !filterStatus || s.status === filterStatus).filter((s) => overdue === undefined || (s.status === 'OVERDUE') === overdue)
  })
}

/** GET /api/invoices/{id} */
function get(id: string): Promise<InvoiceDto> {
  return call(`/api/invoices/${id}`, () => {
    const i = findInvoice(id)
    if (!isAccountant() && (!i.issuedAt || i.clientId !== currentUser().id)) notFound('Facture')
    return detail(i)
  })
}

/** POST /api/invoices/{id}/payments — paiements + avoirs ≤ TTC */
function pay(id: string, date: string, amount: number, method: PaymentMethod): Promise<InvoiceDto> {
  return call(`/api/invoices/${id}/payments`, () => {
    requireAccountant()
    const i = issuedInvoice(id)
    if (!(amount >= 0.01)) invalid('amount', 'doit être supérieur ou égal à 0.01')
    if (date > today()) invalid('date', 'ne doit pas être dans le futur')
    if (cents(amount) > money(i).remaining) conflict('OVERPAYMENT', `Le paiement dépasse le reste dû (${eur(money(i).remaining).toFixed(2)} €)`)
    i.payments.push({ id: uuid(), date, amount: cents(amount), method })
    return detail(i)
  })
}

/** POST /api/invoices/{id}/credit-notes — avoir ≤ reste dû */
function credit(id: string, amount: number, reason: string): Promise<InvoiceDto> {
  return call(`/api/invoices/${id}/credit-notes`, () => {
    requireAccountant()
    const i = issuedInvoice(id)
    if (!(amount >= 0.01)) invalid('amount', 'doit être supérieur ou égal à 0.01')
    if (!reason.trim()) invalid('reason', 'ne doit pas être vide')
    if (cents(amount) > money(i).remaining) conflict('CREDIT_TOO_HIGH', `L'avoir dépasse le reste dû (${eur(money(i).remaining).toFixed(2)} €)`)
    i.credits.push({ id: uuid(), number: next('AVO'), amount: cents(amount), reason: reason.trim(), createdAt: nowIso() })
    return detail(i)
  })
}

/** GET /api/invoices/reminders/due — ACCOUNTANT */
function remindersDue(): Promise<ReminderDueDto[]> {
  return call('/api/invoices/reminders/due', () => {
    requireAccountant()
    return invoices.filter((i) => reminderDue(i) !== null).map((i) => ({ invoiceId: i.id, number: i.number as string, clientName: nameOf(i.clientId), dueDate: i.dueDate, daysOverdue: daysOverdue(i), remaining: eur(money(i).remaining), level: reminderDue(i) as number }))
      .sort((a, b) => b.daysOverdue - a.daysOverdue)
  })
}

/** POST /api/invoices/{id}/reminders — une relance par niveau */
function remind(id: string, level: number): Promise<InvoiceDto> {
  return call(`/api/invoices/${id}/reminders`, () => {
    requireAccountant()
    const i = issuedInvoice(id)
    if (!(level >= 1 && level <= 3)) invalid('level', 'doit être compris entre 1 et 3')
    if (money(i).remaining === 0) conflict('REMINDER_NOT_DUE', 'La facture est soldée')
    if (daysOverdue(i) < REMINDER_DAYS[level - 1]) conflict('REMINDER_NOT_DUE', `Relance de niveau ${level} possible à partir de J+${REMINDER_DAYS[level - 1]}`)
    if (i.reminders.some((r) => r.level === level)) conflict('REMINDER_ALREADY_SENT', `Relance de niveau ${level} déjà envoyée`)
    i.reminders.push({ level, sentAt: nowIso(), sentBy: currentUser().id })
    return detail(i)
  })
}

/** GET /api/invoices/stats?year= — ACCOUNTANT */
function stats(year = new Date().getFullYear()): Promise<StatsDto> {
  return call('/api/invoices/stats', () => {
    requireAccountant()
    const issued = invoices.filter((i) => i.issuedAt)
    const ofYear = issued.filter((i) => new Date(i.issuedAt as string).getFullYear() === year)
    const overdue = issued.filter((i) => status(i) === 'OVERDUE')
    return {
      year,
      invoiced: eur(ofYear.reduce((s, i) => s + money(i).ttc, 0)), credited: eur(ofYear.reduce((s, i) => s + money(i).credited, 0)),
      collected: eur(issued.flatMap((i) => i.payments).filter((p) => p.date.startsWith(`${year}-`)).reduce((s, p) => s + p.amount, 0)),
      outstanding: eur(issued.reduce((s, i) => s + money(i).remaining, 0)), overdueCount: overdue.length, overdueAmount: eur(overdue.reduce((s, i) => s + money(i).remaining, 0)),
    }
  })
}

/** GET /api/invoices/clients */
function clients(): Promise<UserSummary[]> {
  return call('/api/invoices/clients', () => users.filter((u) => u.enabled).map((u) => summary(u.id)))
}

export const mockApi = { ...authApi, myRoles, create, update, issue, list, get, pay, credit, remindersDue, remind, stats, clients }
