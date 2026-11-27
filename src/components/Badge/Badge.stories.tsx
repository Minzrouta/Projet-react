import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './Badge'

const meta = {
  title: 'Composants/Badge',
  component: Badge,
  args: { children: 'Brouillon' },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Neutral: Story = {}
export const Accent: Story = { args: { tone: 'accent', children: 'admin' } }
export const Info: Story = { args: { tone: 'info', children: 'Émise' } }
export const Success: Story = { args: { tone: 'success', children: 'Payée' } }
export const Warning: Story = { args: { tone: 'warning', children: 'Payée partiellement' } }
export const Danger: Story = { args: { tone: 'danger', children: 'En retard' } }
