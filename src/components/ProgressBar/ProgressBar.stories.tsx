import type { Meta, StoryObj } from '@storybook/react-vite'
import { ProgressBar } from './ProgressBar'

const meta = {
  title: 'Composants/ProgressBar',
  component: ProgressBar,
  args: { label: 'Part réglée de la facture', value: 1000, max: 3240 },
} satisfies Meta<typeof ProgressBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Success: Story = { args: { value: 3240, tone: 'success' } }
export const Danger: Story = { args: { tone: 'danger' } }
export const Thick: Story = { args: { thick: true } }
