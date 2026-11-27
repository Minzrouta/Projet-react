import type { Meta, StoryObj } from '@storybook/react-vite'
import { Alert } from './Alert'

const meta = {
  title: 'Composants/Alert',
  component: Alert,
  args: { children: 'Une fois émise, la facture ne peut plus être modifiée.' },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Info: Story = {}
export const Success: Story = { args: { tone: 'success', children: 'Paiement enregistré.' } }
export const Warning: Story = { args: { tone: 'warning', children: 'Réservé au service comptable.' } }
export const Error: Story = { args: { tone: 'error', children: 'Le paiement dépasse le reste dû (800.00 €)' } }
