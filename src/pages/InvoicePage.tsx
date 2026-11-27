import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { mockApi, type ApiError, type InvoiceDto, type PaymentMethod } from '../mocks/api'
import { STATUS, day, euro, useAccountant } from './InvoicesPage'

const METHODS: Record<PaymentMethod, string> = { TRANSFER: 'Virement', CARD: 'Carte', CHECK: 'Chèque', CASH: 'Espèces' }

export default function InvoicePage() {
  const { id = '' } = useParams()
  const accountant = useAccountant()
  const [inv, setInv] = useState<InvoiceDto | null>(null)
  const [pay, setPay] = useState({ date: new Date().toISOString().slice(0, 10), amount: '', method: 'TRANSFER' as PaymentMethod })
  const [credit, setCredit] = useState({ amount: '', reason: '' })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    mockApi.get(id).then(setInv).catch((e: ApiError) => setError(e.message))
  }, [id])

  async function run(action: () => Promise<InvoiceDto>) {
    setError(null)
    try {
      setInv(await action())
      return true
    } catch (e) {
      const err = e as ApiError
      setError(err.fields ? Object.values(err.fields).join(' · ') : err.message)
      return false
    }
  }

  if (!inv) return error ? <div className="alert alert--error">{error}</div> : <div className="loading">Chargement…</div>
  const open = inv.status !== 'DRAFT' && inv.remaining > 0

  return (
    <div className="stack">
      <Link to="/" className="back-link">← Factures</Link>
      <div className="page-header">
        <div>
          <h1>{inv.number ?? 'Brouillon'} <span className={`badge ${STATUS[inv.status][1]}`}>{STATUS[inv.status][0]}</span></h1>
          <p>{inv.clientName} · échéance {day(inv.dueDate)}{inv.issuedAt && ` · émise le ${day(inv.issuedAt)}`}{inv.daysOverdue > 0 && inv.remaining > 0 && ` · ${inv.daysOverdue} jour(s) de retard`}</p>
        </div>
        {accountant && inv.status === 'DRAFT' && (
          <div className="row">
            <Link to={`/invoices/${inv.id}/edit`} className="btn">Modifier</Link>
            <button className="btn btn--primary" onClick={() => run(() => mockApi.issue(inv.id))}>Émettre</button>
          </div>
        )}
      </div>
      {error && <div className="alert alert--error">{error}</div>}
      <div className="card">
        <table className="table">
          <thead><tr><th>Désignation</th><th className="num">Qté</th><th className="num">PU HT</th><th className="num">TVA</th><th className="num">Total TTC</th></tr></thead>
          <tbody>{inv.lines.map((l) => <tr key={l.position}><td>{l.label}</td><td className="num">{l.quantity}</td><td className="num">{euro(l.unitPrice)}</td><td className="num">{l.vatRate} %</td><td className="num">{euro(l.totalTtc)}</td></tr>)}</tbody>
          <tfoot>
            <tr><td colSpan={4}>Total HT / TVA</td><td className="num">{euro(inv.totalHt)} / {euro(inv.totalVat)}</td></tr>
            <tr><td colSpan={4} className="strong">Total TTC</td><td className="num strong">{euro(inv.totalTtc)}</td></tr>
            <tr><td colSpan={4}>Payé · avoirs</td><td className="num">{euro(inv.paid)} · {euro(inv.credited)}</td></tr>
            <tr><td colSpan={4} className="strong">Reste dû</td><td className="num strong">{euro(inv.remaining)}</td></tr>
          </tfoot>
        </table>
      </div>
      <div className="grid grid--2">
        <div className="card stack stack--small">
          <h2>Paiements</h2>
          {inv.payments.length === 0 ? <p className="muted">Aucun paiement.</p> : <ul>{inv.payments.map((p) => <li key={p.id}>{day(p.date)} — {euro(p.amount)} ({METHODS[p.method]})</li>)}</ul>}
          {accountant && open && (
            <div className="row row--wrap">
              <input type="date" value={pay.date} onChange={(e) => setPay({ ...pay, date: e.target.value })} aria-label="Date" />
              <input className="num-input" type="number" step="0.01" placeholder="Montant" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} aria-label="Montant" />
              <select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value as PaymentMethod })} aria-label="Moyen">{(Object.keys(METHODS) as PaymentMethod[]).map((m) => <option key={m} value={m}>{METHODS[m]}</option>)}</select>
              <button className="btn btn--primary btn--small" onClick={() => run(() => mockApi.pay(inv.id, pay.date, Number(pay.amount), pay.method)).then((ok) => ok && setPay({ ...pay, amount: '' }))}>Enregistrer</button>
              <button className="btn btn--ghost btn--small" onClick={() => setPay({ ...pay, amount: String(inv.remaining) })}>Solde</button>
            </div>
          )}
        </div>
        <div className="card stack stack--small">
          <h2>Avoirs</h2>
          {inv.creditNotes.length === 0 ? <p className="muted">Aucun avoir.</p> : <ul>{inv.creditNotes.map((c) => <li key={c.id}><strong>{c.number}</strong> — {euro(c.amount)} : {c.reason}</li>)}</ul>}
          {accountant && open && (
            <div className="row row--wrap">
              <input className="num-input" type="number" step="0.01" placeholder="Montant" value={credit.amount} onChange={(e) => setCredit({ ...credit, amount: e.target.value })} aria-label="Montant de l'avoir" />
              <input placeholder="Motif" value={credit.reason} onChange={(e) => setCredit({ ...credit, reason: e.target.value })} aria-label="Motif" />
              <button className="btn btn--small" onClick={() => run(() => mockApi.credit(inv.id, Number(credit.amount), credit.reason)).then((ok) => ok && setCredit({ amount: '', reason: '' }))}>Créer l'avoir</button>
            </div>
          )}
        </div>
      </div>
      {accountant && inv.status !== 'DRAFT' && (
        <div className="card stack stack--small">
          <h2>Relances</h2>
          {inv.reminders.length === 0 ? <p className="muted">Aucune relance envoyée.</p> : <ul>{inv.reminders.map((r) => <li key={r.level}>Niveau {r.level} — {day(r.sentAt)} par {r.sentByName}</li>)}</ul>}
          {inv.reminderDue && <button className="btn btn--primary btn--small" onClick={() => run(() => mockApi.remind(inv.id, inv.reminderDue as number))}>Enregistrer la relance de niveau {inv.reminderDue}</button>}
        </div>
      )}
    </div>
  )
}
