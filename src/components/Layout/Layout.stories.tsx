import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../Button'
import { Card } from '../Card'
import { Grid, Row, Stack } from './Layout'

const meta = {
  title: 'Composants/Layout',
  component: Stack,
} satisfies Meta<typeof Stack>

export default meta
type Story = StoryObj<typeof meta>

export const StackDefault: Story = {
  name: 'Stack',
  args: { children: [<Card key="a">Premier bloc</Card>, <Card key="b">Deuxième bloc</Card>] },
}

export const StackSmall: Story = {
  name: 'Stack (small)',
  args: { gap: 'small', children: [<p key="a">Ligne 1</p>, <p key="b">Ligne 2</p>] },
}

export const RowBetween: Story = {
  name: 'Row',
  args: { children: null },
  render: () => (
    <Row justify="between">
      <strong>Claire Comptable</strong>
      <Button size="small">Retirer</Button>
    </Row>
  ),
}

export const GridTwoColumns: Story = {
  name: 'Grid (2 colonnes)',
  args: { children: null },
  render: () => (
    <Grid columns={2}>
      <Card title="Paiements">Aucun paiement.</Card>
      <Card title="Avoirs">Aucun avoir.</Card>
    </Grid>
  ),
}
