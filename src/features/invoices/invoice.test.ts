import { describe, expect, it } from 'vitest'
import type { InvoiceSummary } from '../../lib/api'
import { agingBuckets, clientBalances, daysLate, invoiceTotals, lineTotals } from './invoice'

const invoice = (over: Partial<InvoiceSummary>): InvoiceSummary => ({
  id: 'i', number: 'FAC-2026-0001', clientId: 'c1', clientName: 'ACME', status: 'ISSUED', dueDate: '2026-11-30', issuedAt: '2026-11-01T09:00:00Z', totalTtc: 100, remaining: 100, ...over,
})

describe('lineTotals', () => {
  it('arrondit HT et TVA au centime, ligne par ligne', () => {
    expect(lineTotals({ label: 'x', quantity: 3, unitPrice: 0.335, vatRate: 20 })).toEqual({ ht: 1.01, vat: 0.2, ttc: 1.21 })
  })

  it('gère un taux de TVA décimal', () => {
    expect(lineTotals({ label: 'x', quantity: 10, unitPrice: 25, vatRate: 5.5 })).toEqual({ ht: 250, vat: 13.75, ttc: 263.75 })
  })
})

describe('invoiceTotals', () => {
  it("additionne les lignes sans erreur d'arrondi flottant", () => {
    const lines = [
      { label: 'a', quantity: 1, unitPrice: 0.1, vatRate: 20 },
      { label: 'b', quantity: 1, unitPrice: 0.2, vatRate: 20 },
    ]
    expect(invoiceTotals(lines)).toEqual({ ht: 0.3, vat: 0.06, ttc: 0.36 })
  })
})

describe('daysLate', () => {
  const today = new Date(2026, 10, 27)
  it("vaut 0 tant que l'échéance n'est pas passée", () => {
    expect(daysLate('2026-11-27', today)).toBe(0)
    expect(daysLate('2026-12-15', today)).toBe(0)
  })
  it('compte les jours écoulés depuis l’échéance', () => {
    expect(daysLate('2026-11-07', today)).toBe(20)
  })
})

describe('agingBuckets', () => {
  it('range le reste dû des factures en retard par ancienneté et ignore les autres', () => {
    const today = new Date(2026, 10, 27)
    const buckets = agingBuckets(
      [
        invoice({ status: 'OVERDUE', dueDate: '2026-11-24', remaining: 50 }),
        invoice({ status: 'OVERDUE', dueDate: '2026-11-18', remaining: 540 }),
        invoice({ status: 'OVERDUE', dueDate: '2026-10-22', remaining: 3744 }),
        invoice({ status: 'ISSUED', dueDate: '2026-12-10', remaining: 999 }),
      ],
      today,
    )
    expect(buckets.map((b) => b.amount)).toEqual([50, 540, 0, 3744])
  })
})

describe('clientBalances', () => {
  it('cumule par client, sans les brouillons, le plus gros encours en premier', () => {
    const balances = clientBalances([
      invoice({ clientId: 'c1', clientName: 'ACME', totalTtc: 100, remaining: 40 }),
      invoice({ clientId: 'c1', clientName: 'ACME', status: 'OVERDUE', totalTtc: 200, remaining: 200 }),
      invoice({ clientId: 'c2', clientName: 'Globex', totalTtc: 500, remaining: 500 }),
      invoice({ clientId: 'c2', clientName: 'Globex', status: 'DRAFT', totalTtc: 900, remaining: 900 }),
    ])
    expect(balances).toEqual([
      { clientId: 'c2', clientName: 'Globex', count: 1, invoiced: 500, outstanding: 500, overdue: 0 },
      { clientId: 'c1', clientName: 'ACME', count: 2, invoiced: 300, outstanding: 240, overdue: 200 },
    ])
  })
})
