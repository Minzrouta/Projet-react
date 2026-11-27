import type { Meta, StoryObj } from '@storybook/react-vite'
import { Text } from './Text'

const meta = {
  title: 'Composants/Text',
  component: Text,
  args: { children: 'Toute correction passe par un avoir.' },
} satisfies Meta<typeof Text>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Muted: Story = { args: { tone: 'muted' } }
export const SmallMuted: Story = { args: { tone: 'muted', size: 'small', as: 'p' } }
export const Strong: Story = { args: { strong: true, children: '2 240,00 €' } }
export const Danger: Story = { args: { tone: 'danger', strong: true, children: '2 240,00 €' } }
