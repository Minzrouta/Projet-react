import type { Meta, StoryObj } from '@storybook/react-vite'
import { AgingChart } from './AgingChart'

const buckets = [
  { label: 'Moins de 7 jours', amount: 0 },
  { label: '7 à 14 jours', amount: 540 },
  { label: '15 à 29 jours', amount: 2240 },
  { label: '30 jours et plus', amount: 3744 },
]

const meta = {
  title: 'Facturation/AgingChart',
  component: AgingChart,
} satisfies Meta<typeof AgingChart>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { buckets } }
export const NothingOverdue: Story = { args: { buckets: buckets.map((b) => ({ ...b, amount: 0 })) } }
