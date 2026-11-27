// Vocabulaire et calculs du métier, sans React : testables seuls.
import type { BadgeTone } from '../../components/Badge'
import type { InvoiceStatus, InvoiceSummary, LineRequest, PaymentMethod } from '../../lib/api'

export const STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: 'Brouillon',
  ISSUED: 'Émise',
  PARTIALLY_PAID: 'Payée partiellement',
  PAID: 'Payée',
  OVERDUE: 'En retard',
  CANCELLED: 'Annulée',
}

export const STATUS_TONE: Record<InvoiceStatus, BadgeTone> = {
  DRAFT: 'neutral',
  ISSUED: 'info',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  OVERDUE: 'danger',
  CANCELLED: 'neutral',
}

export const STATUSES = Object.keys(STATUS_LABEL) as InvoiceStatus[]

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  TRANSFER: 'Virement',
  CARD: 'Carte',
  CHECK: 'Chèque',
  CASH: 'Espèces',
}

export const VAT_RATES = [20, 10, 5.5, 2.1, 0]

export const REMINDER_LEVELS = [
  { level: 1, days: 7, label: 'Rappel courtois' },
  { level: 2, days: 15, label: 'Relance ferme' },
  { level: 3, days: 30, label: 'Mise en demeure' },
]

const round2 = (n: number) => Math.round(n * 100) / 100

/** Totaux d'une ligne, arrondis au centime comme le fait l'API. */
export function lineTotals(line: LineRequest) {
  const ht = round2(line.quantity * line.unitPrice)
  const vat = round2((ht * line.vatRate) / 100)
  return { ht, vat, ttc: round2(ht + vat) }
}

/** Totaux d'une facture : somme des lignes, chacune déjà arrondie. */
export function invoiceTotals(lines: LineRequest[]) {
  const sum = lines.map(lineTotals).reduce((s, t) => ({ ht: s.ht + t.ht, vat: s.vat + t.vat }), { ht: 0, vat: 0 })
  return { ht: round2(sum.ht), vat: round2(sum.vat), ttc: round2(sum.ht + sum.vat) }
}

export function daysLate(dueDate: string, today = new Date()): number {
  const due = new Date(`${dueDate}T00:00:00`)
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.max(0, Math.round((now.getTime() - due.getTime()) / 86_400_000))
}

export const AGING_BUCKETS = [
  { label: 'Moins de 7 jours', max: 6 },
  { label: '7 à 14 jours', max: 14 },
  { label: '15 à 29 jours', max: 29 },
  { label: '30 jours et plus', max: Infinity },
]

/** Répartit le reste dû des factures en retard par ancienneté du retard. */
export function agingBuckets(invoices: InvoiceSummary[], today = new Date()) {
  const amounts = AGING_BUCKETS.map(() => 0)
  for (const invoice of invoices) {
    if (invoice.status !== 'OVERDUE') continue
    const late = daysLate(invoice.dueDate, today)
    amounts[AGING_BUCKETS.findIndex((b) => late <= b.max)] += invoice.remaining
  }
  return AGING_BUCKETS.map((b, i) => ({ label: b.label, amount: round2(amounts[i]) }))
}

export interface ClientBalance {
  clientId: string
  clientName: string
  count: number
  invoiced: number
  outstanding: number
  overdue: number
}

/** Encours par client à partir des factures émises. */
export function clientBalances(invoices: InvoiceSummary[]): ClientBalance[] {
  const byClient = new Map<string, ClientBalance>()
  for (const invoice of invoices) {
    if (invoice.status === 'DRAFT') continue
    const b = byClient.get(invoice.clientId) ?? { clientId: invoice.clientId, clientName: invoice.clientName, count: 0, invoiced: 0, outstanding: 0, overdue: 0 }
    b.count += 1
    b.invoiced = round2(b.invoiced + invoice.totalTtc)
    b.outstanding = round2(b.outstanding + invoice.remaining)
    if (invoice.status === 'OVERDUE') b.overdue = round2(b.overdue + invoice.remaining)
    byClient.set(invoice.clientId, b)
  }
  return [...byClient.values()].sort((a, b) => b.outstanding - a.outstanding || a.clientName.localeCompare(b.clientName))
}
