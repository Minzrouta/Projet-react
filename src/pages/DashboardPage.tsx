import { useEffect, useState } from 'react'
import { mockApi, type ApiError, type StatsDto } from '../mocks/api'
import { euro, useAccountant } from './InvoicesPage'

export default function DashboardPage() {
  const accountant = useAccountant()
  const [year, setYear] = useState(new Date().getFullYear())
  const [stats, setStats] = useState<StatsDto | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (accountant) mockApi.stats(year).then(setStats).catch((e: ApiError) => setError(e.message))
  }, [accountant, year])

  if (accountant === false) return <div className="alert alert--warning">Réservé au service comptable.</div>
  if (!stats) return error ? <div className="alert alert--error">{error}</div> : <div className="loading">Chargement…</div>

  const tiles: [string, string, string][] = [
    ['Facturé', euro(stats.invoiced), `dont ${euro(stats.credited)} d'avoirs`],
    ['Encaissé', euro(stats.collected), `en ${stats.year}`],
    ['Restant dû', euro(stats.outstanding), 'toutes années'],
    ['En retard', euro(stats.overdueAmount), `${stats.overdueCount} facture(s)`],
  ]

  return (
    <div>
      <div className="page-header">
        <h1>Tableau de bord</h1>
        <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="Année" className="num-input" />
      </div>
      <div className="grid">
        {tiles.map(([label, value, hint]) => (
          <div key={label} className="card stat">
            <span className="stat__label">{label}</span>
            <span className="stat__value">{value}</span>
            <span className="small muted">{hint}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
