import type { Meta, StoryObj } from '@storybook/react-vite'
import { AuthLayout } from './AuthLayout'

const meta = {
  title: 'Composants/AuthLayout',
  component: AuthLayout,
  parameters: { layout: 'fullscreen' },
  args: { title: 'Facturation & relances', subtitle: 'Factures, paiements, avoirs', children: <p>Le formulaire de connexion prend place ici.</p> },
} satisfies Meta<typeof AuthLayout>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
