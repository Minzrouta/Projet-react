import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Badge } from '../Badge'
import { DataTable, type Column } from './Table'

interface Line {
  id: string
  number: string
  client: string
  late: boolean
  remaining: string
}

const rows: Line[] = [
  { id: '1', number: 'FAC-2026-0003', client: 'ACME Industrie', late: true, remaining: '2 240,00 €' },
  { id: '2', number: 'FAC-2026-0007', client: 'Globex SAS', late: false, remaining: '1 823,75 €' },
]

const columns: Column<Line>[] = [
  { key: 'number', header: 'Numéro', cell: (r) => r.number },
  { key: 'client', header: 'Client', cell: (r) => r.client },
  { key: 'status', header: 'Statut', cell: (r) => (r.late ? <Badge tone="danger">En retard</Badge> : <Badge tone="info">Émise</Badge>) },
  { key: 'remaining', header: 'Reste dû', numeric: true, strong: true, cell: (r) => r.remaining },
]

const meta = {
  title: 'Composants/DataTable',
  component: DataTable<Line>,
  args: { caption: 'Factures', columns, rows, rowKey: (r: Line) => r.id },
} satisfies Meta<typeof DataTable<Line>>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('table', { name: 'Factures' })).toBeVisible()
    await expect(canvas.getAllByRole('row')).toHaveLength(3)
  },
}

export const WithFooter: Story = {
  args: { footer: [{ label: 'Total restant dû', value: '4 063,75 €', strong: true }] },
}

export const Compact: Story = { args: { compact: true } }
