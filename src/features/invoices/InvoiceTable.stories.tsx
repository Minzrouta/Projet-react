import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { invoiceList } from './fixtures'
import { InvoiceStatusBadge, InvoiceTable } from './InvoiceTable'
import { STATUSES } from './invoice'

const meta = {
  title: 'Facturation/InvoiceTable',
  component: InvoiceTable,
  args: { caption: 'Factures', invoices: invoiceList },
} satisfies Meta<typeof InvoiceTable>

export default meta
type Story = StoryObj<typeof meta>

export const Accountant: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('row')).toHaveLength(4)
    await expect(canvas.getByRole('link', { name: 'FAC-2026-0003' })).toHaveAttribute('href', '/invoices/inv-3')
    await expect(canvas.getByRole('link', { name: 'Brouillon' })).toBeVisible()
  },
}

export const ForOneClient: Story = {
  args: { showClient: false, invoices: invoiceList.filter((i) => i.clientId === 'u-acme') },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('columnheader', { name: 'Client' })).not.toBeInTheDocument()
  },
}

export const AllStatuses: Story = {
  name: 'Statuts (InvoiceStatusBadge)',
  render: () => (
    <p>
      {STATUSES.map((status) => (
        <InvoiceStatusBadge key={status} status={status} />
      ))}
    </p>
  ),
}
