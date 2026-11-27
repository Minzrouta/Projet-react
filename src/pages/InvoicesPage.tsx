import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { mockApi, type ApiError, type InvoiceStatus, type InvoiceSummary } from '../mocks/api'

export const STATUS: Record<InvoiceStatus, [string, string]> = {
  DRAFT: ['Brouillon', ''], ISSUED: ['Émise', 'badge--info'], PARTIALLY_PAID: ['Payée partiellement', 'badge--warning'],
  PAID: ['Payée', 'badge--success'], OVERDUE: ['En retard', 'badge--danger'], CANCELLED: ['Annulée', ''],
}
export const euro = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
export const day = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('fr-FR')

/** Rôle ACCOUNTANT de l'utilisateur courant. */
export function useAccountant() {
  const [acc, setAcc] = useState<boolean | null>(null)
  useEffect(() => {
    mockApi.myRoles().then((r) => setAcc(r.includes('ACCOUNTANT'))).catch(() => setAcc(false))
  }, [])
  return acc
}

export default function InvoicesPage() {
  const accountant = useAccountant()
  const [status, setStatus] = useState<InvoiceStatus | ''>('')
  const [list, setList] = useState<InvoiceSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    mockApi.list(status || undefined).then(setList).catch((e: ApiError) => setError(e.message))
  }, [status])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{accountant ? 'Factures' : 'Mes factures'}</h1>
          <p>{list ? `${list.length} facture(s)` : '…'}</p>
        </div>
        <div className="row">
          <select value={status} onChange={(e) => setStatus(e.target.value as InvoiceStatus | '')} aria-label="Statut">
            <option value="">Tous les statuts</option>
            {(Object.keys(STATUS) as InvoiceStatus[]).filter((s) => accountant || s !== 'DRAFT').map((s) => <option key={s} value={s}>{STATUS[s][0]}</option>)}
          </select>
          {accountant && <Link to="/new" className="btn btn--primary">Nouvelle facture</Link>}
        </div>
      </div>
      {error && <div className="alert alert--error">{error}</div>}
      {!list ? <div className="loading">Chargement…</div> : list.length === 0 ? <div className="empty">Aucune facture.</div> : (
        <table className="table">
          <thead><tr><th>Numéro</th>{accountant && <th>Client</th>}<th>Échéance</th><th>Statut</th><th className="num">TTC</th><th className="num">Reste dû</th></tr></thead>
          <tbody>
            {list.map((i) => (
              <tr key={i.id}>
                <td><Link to={`/invoices/${i.id}`}>{i.number ?? 'Brouillon'}</Link></td>
                {accountant && <td>{i.clientName}</td>}
                <td>{day(i.dueDate)}</td>
                <td><span className={`badge ${STATUS[i.status][1]}`}>{STATUS[i.status][0]}</span></td>
                <td className="num">{euro(i.totalTtc)}</td>
                <td className="num strong">{euro(i.remaining)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
