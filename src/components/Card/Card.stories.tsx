import type { Meta, StoryObj } from '@storybook/react-vite'
import { Card } from './Card'

const meta = {
  title: 'Composants/Card',
  component: Card,
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const WithTitle: Story = { args: { title: 'Paiements', children: <p>Aucun paiement.</p> } }
export const ContentOnly: Story = { args: { children: <p>Une carte sans titre sert de simple cadre.</p> } }
