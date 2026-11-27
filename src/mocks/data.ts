// Données de démonstration, chargées en mémoire au démarrage de l'application.
import type { Role } from './api'

export interface MockUser {
  id: string
  email: string
  password: string
  displayName: string
  role: Role
  enabled: boolean
  note?: string
}

export const users: MockUser[] = [
  { id: 'u-admin', email: 'admin@example.com', password: 'admin123', displayName: 'Admin Démo', role: 'ADMIN', enabled: true, note: 'comptable d\'office' },
  { id: 'u-claire', email: 'claire@example.com', password: 'claire123', displayName: 'Claire Comptable', role: 'USER', enabled: true, note: 'rôle ACCOUNTANT' },
  { id: 'u-acme', email: 'acme@example.com', password: 'acme123', displayName: 'ACME Industrie', role: 'USER', enabled: true, note: 'client, une facture en retard' },
  { id: 'u-globex', email: 'globex@example.com', password: 'globex123', displayName: 'Globex SAS', role: 'USER', enabled: true, note: 'client' },
]

// ---------- Facturation & relances ----------
// Montants en centimes dans le bouchon (l'API renvoie des euros à 2 décimales).

export type PaymentMethod = 'TRANSFER' | 'CARD' | 'CHECK' | 'CASH'

export interface LineRecord { label: string; quantity: number; unitPrice: number; vatRate: number }
export interface InvoiceRecord {
  id: string; number: string | null; clientId: string; dueDate: string; issuedAt: string | null; createdAt: string; lines: LineRecord[]
  payments: { id: string; date: string; amount: number; method: PaymentMethod }[]
  credits: { id: string; number: string; amount: number; reason: string; createdAt: string }[]
  reminders: { level: number; sentAt: string; sentBy: string }[]
}

/** Rôles propres à l'application (table invoice_roles côté API). */
export const appRoles: Record<string, string[]> = { 'u-claire': ['ACCOUNTANT'] }

export const sequences: Record<string, number> = {}

const date = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)
const at = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString()
const year = new Date().getFullYear()

export const invoices: InvoiceRecord[] = [
  { id: 'inv-1', number: `FAC-${year}-0001`, clientId: 'u-acme', dueDate: date(-20), issuedAt: at(-50), createdAt: at(-51), lines: [{ label: 'Audit de sécurité', quantity: 3, unitPrice: 90000, vatRate: 20 }], payments: [{ id: 'p1', date: date(-25), amount: 100000, method: 'TRANSFER' }], credits: [], reminders: [{ level: 1, sentAt: at(-13), sentBy: 'u-claire' }] },
  { id: 'inv-2', number: `FAC-${year}-0002`, clientId: 'u-globex', dueDate: date(15), issuedAt: at(-15), createdAt: at(-16), lines: [{ label: 'Formation React — 2 jours', quantity: 2, unitPrice: 65000, vatRate: 20 }, { label: 'Support de cours', quantity: 10, unitPrice: 2500, vatRate: 5.5 }], payments: [], credits: [], reminders: [] },
  { id: 'inv-3', number: `FAC-${year}-0003`, clientId: 'u-acme', dueDate: date(-40), issuedAt: at(-70), createdAt: at(-71), lines: [{ label: 'Licence annuelle', quantity: 1, unitPrice: 120000, vatRate: 20 }], payments: [{ id: 'p2', date: date(-45), amount: 144000, method: 'CARD' }], credits: [], reminders: [] },
  { id: 'inv-4', number: null, clientId: 'u-globex', dueDate: date(30), issuedAt: null, createdAt: at(-1), lines: [{ label: 'Maintenance — décembre', quantity: 1, unitPrice: 45000, vatRate: 20 }], payments: [], credits: [], reminders: [] },
]

sequences[`FAC-${year}`] = 3
