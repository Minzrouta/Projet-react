import { DataTable, type Column } from '../../components/Table'
import type { InvoiceDto, LineDto } from '../../lib/api'
import { euro } from '../../lib/format'

const columns: Column<LineDto>[] = [
  { key: 'label', header: 'Désignation', cell: (l) => l.label },
  { key: 'quantity', header: 'Qté', numeric: true, cell: (l) => l.quantity },
  { key: 'unitPrice', header: 'PU HT', numeric: true, cell: (l) => euro(l.unitPrice) },
  { key: 'vat', header: 'TVA', numeric: true, cell: (l) => `${l.vatRate} %` },
  { key: 'total', header: 'Total TTC', numeric: true, cell: (l) => euro(l.totalTtc) },
]

/** Lignes d'une facture et ses totaux. */
export function InvoiceLines({ invoice }: { invoice: InvoiceDto }) {
  return (
    <DataTable
      caption="Lignes de la facture"
      columns={columns}
      rows={invoice.lines}
      rowKey={(l) => l.position}
      footer={[
        { label: 'Total HT / TVA', value: `${euro(invoice.totalHt)} / ${euro(invoice.totalVat)}` },
        { label: 'Total TTC', value: euro(invoice.totalTtc), strong: true },
        { label: 'Payé · avoirs', value: `${euro(invoice.paid)} · ${euro(invoice.credited)}` },
        { label: 'Reste dû', value: euro(invoice.remaining), strong: true },
      ]}
    />
  )
}
