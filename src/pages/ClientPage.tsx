import { useParams } from 'react-router'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { Grid, Stack } from '../components/Layout'
import { Loader } from '../components/Loader'
import { PageHeader } from '../components/PageHeader'
import { StatTile } from '../components/StatTile'
import { clientBalances } from '../features/invoices/invoice'
import { InvoiceTable } from '../features/invoices/InvoiceTable'
import { useQuery } from '../hooks/useQuery'
import { api } from '../lib/api'
import { euro, plural } from '../lib/format'

/** Relevé de compte d'un client : ses factures émises et ce qu'il doit encore. */
export default function ClientPage() {
  const { id = '' } = useParams()
  const invoices = useQuery(`client:${id}`, async () => (await api.listInvoices({ clientId: id })).filter((i) => i.status !== 'DRAFT'))
  const clients = useQuery('clients', () => api.clients())

  const name = clients.data?.find((c) => c.id === id)?.displayName ?? invoices.data?.[0]?.clientName ?? 'Client'
  const balance = invoices.data ? clientBalances(invoices.data)[0] : undefined

  return (
    <Stack>
      <PageHeader title={name} subtitle="Relevé de compte" back={{ to: '/clients', label: 'Clients' }} actions={balance && <Button onClick={() => window.print()}>Imprimer le relevé</Button>} />
      {invoices.error && <ErrorState error={invoices.error} onRetry={invoices.reload} />}
      {!invoices.data && !invoices.error && <Loader />}
      {invoices.data && !balance && <EmptyState>Aucune facture émise pour ce client.</EmptyState>}
      {invoices.data && balance && (
        <>
          <Grid>
            <StatTile label="Facturé" value={euro(balance.invoiced)} hint={plural(balance.count, 'facture')} />
            <StatTile label="Reste dû" value={euro(balance.outstanding)} />
            <StatTile label="Dont en retard" value={euro(balance.overdue)} />
          </Grid>
          <InvoiceTable caption={`Factures de ${name}`} invoices={invoices.data} showClient={false} />
        </>
      )}
    </Stack>
  )
}
