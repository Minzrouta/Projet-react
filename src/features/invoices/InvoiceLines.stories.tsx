import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { draftInvoice, overdueInvoice } from './fixtures'
import { InvoiceLines } from './InvoiceLines'

const meta = {
  title: 'Facturation/InvoiceLines',
  component: InvoiceLines,
} satisfies Meta<typeof InvoiceLines>

export default meta
type Story = StoryObj<typeof meta>

export const PartiallyPaid: Story = {
  args: { invoice: overdueInvoice },
  play: async ({ canvasElement }) => {
    const row = within(canvasElement).getByRole('row', { name: /Reste dû/ })
    await expect(row).toHaveTextContent(/2\s240,00/)
  },
}

export const TwoLines: Story = { args: { invoice: draftInvoice } }
