import { Link } from 'react-router'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { Loader } from '../components/Loader'
import { PageHeader } from '../components/PageHeader'
import { DataTable, type Column } from '../components/Table'
import { Text } from '../components/Text'
import { clientBalances, type ClientBalance } from '../features/invoices/invoice'
import { useQuery } from '../hooks/useQuery'
import { api } from '../lib/api'
import { euro, plural } from '../lib/format'

const columns: Column<ClientBalance>[] = [
  { key: 'client', header: 'Client', cell: (c) => <Link to={`/clients/${c.clientId}`}>{c.clientName}</Link> },
  { key: 'count', header: 'Factures', numeric: true, cell: (c) => c.count },
  { key: 'invoiced', header: 'Facturé', numeric: true, cell: (c) => euro(c.invoiced) },
  { key: 'outstanding', header: 'Reste dû', numeric: true, strong: true, cell: (c) => euro(c.outstanding) },
  {
    key: 'overdue',
    header: 'Dont en retard',
    numeric: true,
    cell: (c) =>
      c.overdue > 0 ? (
        <Text tone="danger" strong>
          {euro(c.overdue)}
        </Text>
      ) : (
        euro(0)
      ),
  },
]

/** Encours par client, calculé à partir des factures émises. */
export default function ClientsPage() {
  const invoices = useQuery('invoices:', () => api.listInvoices())
  const balances = invoices.data ? clientBalances(invoices.data) : null

  return (
    <>
      <PageHeader title="Clients" subtitle={balances ? plural(balances.length, 'client facturé', 'clients facturés') : '…'} />
      {invoices.error && <ErrorState error={invoices.error} onRetry={invoices.reload} />}
      {!balances && !invoices.error && <Loader />}
      {balances && (balances.length === 0 ? <EmptyState>Aucun client facturé pour le moment.</EmptyState> : <DataTable caption="Encours par client" columns={columns} rows={balances} rowKey={(c) => c.clientId} />)}
    </>
  )
}
