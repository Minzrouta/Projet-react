// Contrat de l'API : mêmes routes et DTO que le backend Spring Boot (Swagger, tags Auth, Users, Facturation, Simulation).

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

/** Format d'erreur unique de l'API. `status: 0` = réseau injoignable ou délai dépassé. */
export interface ApiError {
  status: number
  code: string
  message: string
  path: string
  fields?: Record<string, string>
  /** Secondes à attendre avant de réessayer (en-tête Retry-After, 429 et 503). */
  retryAfter?: number
}

export function isApiError(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && 'status' in e && 'code' in e && 'message' in e
}

export function toApiError(e: unknown): ApiError {
  if (isApiError(e)) return e
  return { status: 0, code: 'UNKNOWN', message: e instanceof Error ? e.message : 'Erreur inattendue', path: '' }
}

export interface Page<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface CreateUserRequest {
  email: string
  password: string
  displayName: string
  role: Role
}

export interface UpdateUserRequest {
  email: string
  displayName: string
  role: Role
  enabled: boolean
}

export interface DemoAccount {
  email: string
  password: string
  displayName: string
  role: Role
  note?: string
}

export type PaymentMethod = 'TRANSFER' | 'CARD' | 'CHECK' | 'CASH'
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED'

export interface LineRequest {
  label: string
  quantity: number
  unitPrice: number
  vatRate: number
}

export interface InvoiceRequest {
  clientId: string
  lines: LineRequest[]
  dueDate: string
}

export interface LineDto extends LineRequest {
  position: number
  totalHt: number
  totalVat: number
  totalTtc: number
}

export interface InvoiceSummary {
  id: string
  number: string | null
  clientId: string
  clientName: string
  status: InvoiceStatus
  dueDate: string
  issuedAt: string | null
  totalTtc: number
  remaining: number
}

export interface PaymentDto {
  id: string
  date: string
  amount: number
  method: PaymentMethod
}

export interface CreditNoteDto {
  id: string
  number: string
  amount: number
  reason: string
  createdAt: string
}

export interface ReminderDto {
  level: number
  sentAt: string
  sentByName: string
}

export interface InvoiceDto extends InvoiceSummary {
  lines: LineDto[]
  totalHt: number
  totalVat: number
  paid: number
  credited: number
  daysOverdue: number
  payments: PaymentDto[]
  creditNotes: CreditNoteDto[]
  reminders: ReminderDto[]
  reminderDue: number | null
}

export interface ReminderDueDto {
  invoiceId: string
  number: string
  clientName: string
  dueDate: string
  daysOverdue: number
  remaining: number
  level: number
}

export interface StatsDto {
  year: number
  invoiced: number
  credited: number
  collected: number
  outstanding: number
  overdueCount: number
  overdueAmount: number
}

export interface PaymentRequest {
  date: string
  amount: number
  method: PaymentMethod
}

export interface CreditRequest {
  amount: number
  reason: string
}

export interface InvoiceFilters {
  status?: InvoiceStatus
  clientId?: string
  overdue?: boolean
}

export interface RoleDto {
  userId: string
  displayName: string
  role: string
}

export type LatencyLevel = 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH'
export type FailureMode = 'NONE' | 'FIXED' | 'RANDOM'

export interface FailureRequest {
  mode: FailureMode
  status?: number
  rate?: number
}

export interface SimulationDto {
  latency: LatencyLevel
  failure: { mode: FailureMode; status: number | null; rate: number }
}

export const FAILURE_STATUSES = [400, 401, 403, 404, 409, 422, 429, 500, 502, 503]

/** Les deux implémentations (bouchon en mémoire, client HTTP) respectent cette interface. */
export interface Api {
  readonly mode: 'mock' | 'http'
  demoAccounts(): DemoAccount[]

  login(email: string, password: string): Promise<UserDto>
  /** Reprend la session après un rechargement de page, si possible. */
  restore(): Promise<UserDto | null>
  logout(): void
  /** Appelé quand la session ne peut plus être prolongée. */
  onSessionExpired(listener: () => void): void

  myRoles(): Promise<string[]>
  clients(): Promise<UserSummary[]>
  listInvoices(filters?: InvoiceFilters): Promise<InvoiceSummary[]>
  getInvoice(id: string): Promise<InvoiceDto>
  createInvoice(req: InvoiceRequest): Promise<InvoiceDto>
  updateInvoice(id: string, req: InvoiceRequest): Promise<InvoiceDto>
  issueInvoice(id: string): Promise<InvoiceDto>
  addPayment(id: string, req: PaymentRequest): Promise<InvoiceDto>
  addCreditNote(id: string, req: CreditRequest): Promise<InvoiceDto>
  sendReminder(id: string, level: number): Promise<InvoiceDto>
  remindersDue(): Promise<ReminderDueDto[]>
  stats(year?: number): Promise<StatsDto>

  // ADMIN
  listUsers(params?: { page?: number; size?: number; search?: string }): Promise<Page<UserDto>>
  getUser(id: string): Promise<UserDto>
  createUser(req: CreateUserRequest): Promise<UserDto>
  updateUser(id: string, req: UpdateUserRequest): Promise<UserDto>
  deleteUser(id: string): Promise<void>
  listRoles(): Promise<RoleDto[]>
  grantAccountant(userId: string): Promise<void>
  revokeAccountant(userId: string): Promise<void>
  getSimulation(): Promise<SimulationDto>
  setLatency(level: LatencyLevel): Promise<SimulationDto>
  setFailure(req: FailureRequest): Promise<SimulationDto>
  resetSimulation(): Promise<SimulationDto>
}
