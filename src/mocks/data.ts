// Données de démonstration, en mémoire : elles repartent de zéro à chaque rechargement.
// Montants en centimes ici ; l'API renvoie des euros à 2 décimales.
import type { PaymentMethod, Role } from '../lib/api/types'

export interface MockUser {
  id: string
  email: string
  password: string
  displayName: string
  role: Role
  enabled: boolean
  note?: string
}

export interface LineRecord {
  label: string
  quantity: number
  unitPrice: number
  vatRate: number
}

export interface InvoiceRecord {
  id: string
  number: string | null
  clientId: string
  dueDate: string
  issuedAt: string | null
  createdAt: string
  lines: LineRecord[]
  payments: { id: string; date: string; amount: number; method: PaymentMethod }[]
  credits: { id: string; number: string; amount: number; reason: string; createdAt: string }[]
  reminders: { level: number; sentAt: string; sentBy: string }[]
}

export const users: MockUser[] = [
  { id: 'u-admin', email: 'admin@example.com', password: 'admin123', displayName: 'Admin Démo', role: 'ADMIN', enabled: true, note: "comptable d'office" },
  { id: 'u-claire', email: 'claire@example.com', password: 'claire123', displayName: 'Claire Comptable', role: 'USER', enabled: true, note: 'rôle ACCOUNTANT' },
  { id: 'u-acme', email: 'acme@example.com', password: 'acme123', displayName: 'ACME Industrie', role: 'USER', enabled: true, note: 'client, des factures en retard' },
  { id: 'u-globex', email: 'globex@example.com', password: 'globex123', displayName: 'Globex SAS', role: 'USER', enabled: true, note: 'client' },
  { id: 'u-initech', email: 'initech@example.com', password: 'initech123', displayName: 'Initech Conseil', role: 'USER', enabled: true, note: 'client' },
  { id: 'u-hooli', email: 'hooli@example.com', password: 'hooli123', displayName: 'Hooli France', role: 'USER', enabled: true, note: 'client' },
]

/** Rôles propres à l'application (table invoice_roles côté API). */
export const appRoles: Record<string, string[]> = { 'u-claire': ['ACCOUNTANT'] }

export const sequences: Record<string, number> = {}

const DAY = 86_400_000
const date = (n: number) => new Date(Date.now() + n * DAY).toISOString().slice(0, 10)
const at = (n: number) => new Date(Date.now() + n * DAY).toISOString()
const year = new Date().getFullYear()

let seq = 0
function issued(clientId: string, issuedDaysAgo: number, dueIn: number, lines: LineRecord[], rest: Partial<InvoiceRecord> = {}): InvoiceRecord {
  seq += 1
  return {
    id: `inv-${seq}`, number: `FAC-${year}-${String(seq).padStart(4, '0')}`, clientId, dueDate: date(dueIn),
    issuedAt: at(-issuedDaysAgo), createdAt: at(-issuedDaysAgo - 1), lines, payments: [], credits: [], reminders: [], ...rest,
  }
}

// Du plus ancien au plus récent : la numérotation suit l'ordre d'émission.
export const invoices: InvoiceRecord[] = [
  issued('u-acme', 70, -40, [{ label: 'Licence annuelle', quantity: 1, unitPrice: 120000, vatRate: 20 }], {
    payments: [{ id: 'p1', date: date(-45), amount: 144000, method: 'CARD' }],
  }),
  issued('u-hooli', 66, -36, [{ label: 'Migration de la messagerie', quantity: 4, unitPrice: 78000, vatRate: 20 }], {
    reminders: [{ level: 1, sentAt: at(-28), sentBy: 'u-claire' }, { level: 2, sentAt: at(-20), sentBy: 'u-claire' }],
  }),
  issued('u-acme', 50, -20, [{ label: 'Audit de sécurité', quantity: 3, unitPrice: 90000, vatRate: 20 }], {
    payments: [{ id: 'p2', date: date(-25), amount: 100000, method: 'TRANSFER' }],
    reminders: [{ level: 1, sentAt: at(-13), sentBy: 'u-claire' }],
  }),
  issued('u-initech', 44, -14, [
    { label: 'Atelier de cadrage', quantity: 1, unitPrice: 140000, vatRate: 20 },
    { label: 'Frais de déplacement', quantity: 1, unitPrice: 18650, vatRate: 10 },
  ], {
    payments: [{ id: 'p3', date: date(-16), amount: 188515, method: 'TRANSFER' }],
  }),
  issued('u-acme', 39, -9, [{ label: 'Maintenance - octobre', quantity: 1, unitPrice: 45000, vatRate: 20 }]),
  issued('u-globex', 30, 0, [{ label: 'Développement du module export', quantity: 6, unitPrice: 62000, vatRate: 20 }], {
    credits: [{ id: 'c1', number: `AVO-${year}-0001`, amount: 74400, reason: 'Geste commercial : une journée offerte', createdAt: at(-12) }],
    payments: [{ id: 'p4', date: date(-5), amount: 200000, method: 'CHECK' }],
  }),
  issued('u-globex', 15, 15, [
    { label: 'Formation React - 2 jours', quantity: 2, unitPrice: 65000, vatRate: 20 },
    { label: 'Support de cours', quantity: 10, unitPrice: 2500, vatRate: 5.5 },
  ]),
  issued('u-initech', 8, 22, [{ label: 'Hébergement - 4e trimestre', quantity: 3, unitPrice: 9900, vatRate: 20 }], {
    credits: [{ id: 'c2', number: `AVO-${year}-0002`, amount: 35640, reason: 'Facture émise en double', createdAt: at(-7) }],
  }),
  issued('u-hooli', 3, 27, [{ label: 'Recette et mise en production', quantity: 2, unitPrice: 70000, vatRate: 20 }]),
  {
    id: 'inv-draft', number: null, clientId: 'u-globex', dueDate: date(30), issuedAt: null, createdAt: at(-1),
    lines: [{ label: 'Maintenance - décembre', quantity: 1, unitPrice: 45000, vatRate: 20 }], payments: [], credits: [], reminders: [],
  },
]

sequences[`FAC-${year}`] = seq
sequences[`AVO-${year}`] = 2
