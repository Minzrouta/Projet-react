// Jeux de données des stories.
import type { InvoiceDto, InvoiceSummary, UserSummary } from '../../lib/api'
import { isoDate } from '../../lib/format'

export const clients: UserSummary[] = [
  { id: 'u-acme', displayName: 'ACME Industrie' },
  { id: 'u-globex', displayName: 'Globex SAS' },
]

export const overdueInvoice: InvoiceDto = {
  id: 'inv-3', number: 'FAC-2026-0003', clientId: 'u-acme', clientName: 'ACME Industrie', status: 'OVERDUE',
  dueDate: isoDate(-20), issuedAt: `${isoDate(-50)}T09:00:00Z`,
  lines: [{ position: 0, label: 'Audit de sécurité', quantity: 3, unitPrice: 900, vatRate: 20, totalHt: 2700, totalVat: 540, totalTtc: 3240 }],
  totalHt: 2700, totalVat: 540, totalTtc: 3240, paid: 1000, credited: 0, remaining: 2240, daysOverdue: 20,
  payments: [{ id: 'p2', date: isoDate(-25), amount: 1000, method: 'TRANSFER' }],
  creditNotes: [],
  reminders: [{ level: 1, sentAt: `${isoDate(-13)}T10:00:00Z`, sentByName: 'Claire Comptable' }],
  reminderDue: 2,
}

export const paidInvoice: InvoiceDto = {
  ...overdueInvoice, id: 'inv-1', number: 'FAC-2026-0001', status: 'PAID', dueDate: isoDate(-40), issuedAt: `${isoDate(-70)}T09:00:00Z`,
  lines: [{ position: 0, label: 'Licence annuelle', quantity: 1, unitPrice: 1200, vatRate: 20, totalHt: 1200, totalVat: 240, totalTtc: 1440 }],
  totalHt: 1200, totalVat: 240, totalTtc: 1440, paid: 1440, remaining: 0, daysOverdue: 40,
  payments: [{ id: 'p1', date: isoDate(-45), amount: 1440, method: 'CARD' }], reminders: [], reminderDue: null,
}

export const draftInvoice: InvoiceDto = {
  ...overdueInvoice, id: 'inv-draft', number: null, clientId: 'u-globex', clientName: 'Globex SAS', status: 'DRAFT', dueDate: isoDate(30), issuedAt: null,
  lines: [
    { position: 0, label: 'Formation React - 2 jours', quantity: 2, unitPrice: 650, vatRate: 20, totalHt: 1300, totalVat: 260, totalTtc: 1560 },
    { position: 1, label: 'Support de cours', quantity: 10, unitPrice: 25, vatRate: 5.5, totalHt: 250, totalVat: 13.75, totalTtc: 263.75 },
  ],
  totalHt: 1550, totalVat: 273.75, totalTtc: 1823.75, paid: 0, remaining: 1823.75, daysOverdue: 0, payments: [], reminders: [], reminderDue: null,
}

const summary = ({ id, number, clientId, clientName, status, dueDate, issuedAt, totalTtc, remaining }: InvoiceDto): InvoiceSummary => ({ id, number, clientId, clientName, status, dueDate, issuedAt, totalTtc, remaining })

export const invoiceList: InvoiceSummary[] = [draftInvoice, overdueInvoice, paidInvoice].map(summary)
