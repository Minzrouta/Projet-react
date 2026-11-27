import type { Meta, StoryObj } from '@storybook/react-vite'
import { Grid } from '../Layout'
import { StatTile } from './StatTile'

const meta = {
  title: 'Composants/StatTile',
  component: StatTile,
  args: { label: 'Encaissé', value: '6 325,15 €', hint: 'en 2026' },
} satisfies Meta<typeof StatTile>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithoutHint: Story = { args: { hint: undefined } }

export const InGrid: Story = {
  render: () => (
    <Grid>
      <StatTile label="Facturé" value="18 407,00 €" hint="dont 1 100,40 € d'avoirs" />
      <StatTile label="Encaissé" value="6 325,15 €" hint="en 2026" />
      <StatTile label="Restant dû" value="10 981,45 €" hint="toutes années" />
      <StatTile label="En retard" value="6 524,00 €" hint="3 facture(s)" />
    </Grid>
  ),
}
