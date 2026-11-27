import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from '../Badge'
import { Button, ButtonLink } from '../Button'
import { PageHeader } from './PageHeader'

const meta = {
  title: 'Composants/PageHeader',
  component: PageHeader,
  args: { title: 'Factures' },
} satisfies Meta<typeof PageHeader>

export default meta
type Story = StoryObj<typeof meta>

export const TitleOnly: Story = {}

export const WithActions: Story = {
  args: {
    subtitle: '10 facture(s)',
    actions: (
      <ButtonLink to="/new" variant="primary">
        Nouvelle facture
      </ButtonLink>
    ),
  },
}

export const Detail: Story = {
  args: {
    title: 'FAC-2026-0003',
    adornment: <Badge tone="danger">En retard</Badge>,
    subtitle: 'ACME Industrie · échéance 07/11/2026',
    back: { to: '/', label: 'Factures' },
    actions: <Button>Imprimer</Button>,
  },
}
