import { Link } from 'react-router'
import { Badge } from '../../components/Badge'
import { DataTable, type Column } from '../../components/Table'
import type { InvoiceStatus, InvoiceSummary } from '../../lib/api'
import { day, euro } from '../../lib/format'
import { STATUS_LABEL, STATUS_TONE } from './invoice'

/** Spécialisation de Badge : le statut d'une facture porte toujours le même libellé et la même couleur. */
export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
}

interface InvoiceTableProps {
  caption: string
  invoices: InvoiceSummary[]
  /** Colonne Client : inutile quand la liste est celle d'un seul client. */
  showClient?: boolean
}

export function InvoiceTable({ caption, invoices, showClient = true }: InvoiceTableProps) {
  const columns: Column<InvoiceSummary>[] = [
    { key: 'number', header: 'Numéro', cell: (i) => <Link to={`/invoices/${i.id}`}>{i.number ?? 'Brouillon'}</Link> },
    ...(showClient ? [{ key: 'client', header: 'Client', cell: (i: InvoiceSummary) => i.clientName }] : []),
    { key: 'dueDate', header: 'Échéance', cell: (i) => day(i.dueDate) },
    { key: 'status', header: 'Statut', cell: (i) => <InvoiceStatusBadge status={i.status} /> },
    { key: 'total', header: 'TTC', numeric: true, cell: (i) => euro(i.totalTtc) },
    { key: 'remaining', header: 'Reste dû', numeric: true, strong: true, cell: (i) => euro(i.remaining) },
  ]
  return <DataTable caption={caption} columns={columns} rows={invoices} rowKey={(i) => i.id} />
}
