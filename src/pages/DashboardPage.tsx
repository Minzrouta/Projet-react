import { useState } from 'react'
import { Card } from '../components/Card'
import { ErrorState } from '../components/ErrorState'
import { TextField } from '../components/Field'
import { Grid, Stack } from '../components/Layout'
import { Loader } from '../components/Loader'
import { PageHeader } from '../components/PageHeader'
import { StatTile } from '../components/StatTile'
import { AgingChart } from '../features/invoices/AgingChart'
import { agingBuckets } from '../features/invoices/invoice'
import { useQuery } from '../hooks/useQuery'
import { api } from '../lib/api'
import { euro, plural } from '../lib/format'

export default function DashboardPage() {
  const [year, setYear] = useState(() => new Date().getFullYear())
  const stats = useQuery(`stats:${year}`, () => api.stats(year))
  const overdue = useQuery('overdue', () => api.listInvoices({ overdue: true }))

  return (
    <Stack>
      <PageHeader title="Tableau de bord" actions={<TextField label="Année" hideLabel numeric type="number" min={2000} max={2100} value={year} onChange={(e) => setYear(Number(e.target.value))} />} />

      {stats.error && <ErrorState error={stats.error} onRetry={stats.reload} />}
      {!stats.data && !stats.error && <Loader />}
      {stats.data && (
        <Grid>
          <StatTile label="Facturé" value={euro(stats.data.invoiced)} hint={`dont ${euro(stats.data.credited)} d'avoirs`} />
          <StatTile label="Encaissé" value={euro(stats.data.collected)} hint={`en ${stats.data.year}`} />
          <StatTile label="Restant dû" value={euro(stats.data.outstanding)} hint="toutes années" />
          <StatTile label="En retard" value={euro(stats.data.overdueAmount)} hint={plural(stats.data.overdueCount, 'facture')} />
        </Grid>
      )}

      <Card title="Retards par ancienneté">
        {overdue.error && <ErrorState error={overdue.error} onRetry={overdue.reload} />}
        {!overdue.data && !overdue.error && <Loader />}
        {overdue.data && <AgingChart buckets={agingBuckets(overdue.data)} />}
      </Card>
    </Stack>
  )
}
