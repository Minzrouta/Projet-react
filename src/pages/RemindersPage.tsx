import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { mockApi, type ApiError, type ReminderDueDto } from '../mocks/api'
import { day, euro, useAccountant } from './InvoicesPage'

const LEVEL = ['', 'Rappel courtois (J+7)', 'Relance ferme (J+15)', 'Mise en demeure (J+30)']

export default function RemindersPage() {
  const accountant = useAccountant()
  const [list, setList] = useState<ReminderDueDto[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    if (accountant) mockApi.remindersDue().then(setList).catch((e: ApiError) => setError(e.message))
  }, [accountant, reload])

  async function send(r: ReminderDueDto) {
    setError(null)
    try {
      await mockApi.remind(r.invoiceId, r.level)
      setReload((n) => n + 1)
    } catch (e) {
      setError((e as ApiError).message)
    }
  }

  if (accountant === false) return <div className="alert alert--warning">Réservé au service comptable.</div>

  return (
    <div className="narrow-page">
      <h1>Relances à envoyer</h1>
      {error && <div className="alert alert--error">{error}</div>}
      {!list ? <div className="loading">Chargement…</div> : list.length === 0 ? <div className="empty">Aucune relance à envoyer.</div> : (
        <table className="table">
          <thead><tr><th>Facture</th><th>Client</th><th>Retard</th><th className="num">Reste dû</th><th>Niveau</th><th /></tr></thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.invoiceId}>
                <td><Link to={`/invoices/${r.invoiceId}`}>{r.number}</Link></td>
                <td>{r.clientName}</td>
                <td>{r.daysOverdue} j (échéance {day(r.dueDate)})</td>
                <td className="num strong">{euro(r.remaining)}</td>
                <td><span className={`badge ${r.level === 3 ? 'badge--danger' : 'badge--warning'}`}>{LEVEL[r.level]}</span></td>
                <td><button className="btn btn--primary btn--small" onClick={() => send(r)}>Marquer envoyée</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
