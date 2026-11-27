import type { Meta, StoryObj } from '@storybook/react-vite'
import { ButtonLink } from '../Button'
import { EmptyState } from './EmptyState'

const meta = {
  title: 'Composants/EmptyState',
  component: EmptyState,
  args: { children: 'Aucune relance à envoyer.' },
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithAction: Story = {
  args: {
    children: 'Aucune facture.',
    action: (
      <ButtonLink to="/new" variant="primary">
        Nouvelle facture
      </ButtonLink>
    ),
  },
}
