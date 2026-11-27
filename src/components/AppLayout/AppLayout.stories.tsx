import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { PageHeader } from '../PageHeader'
import { AppLayout } from './AppLayout'

const meta = {
  title: 'Composants/AppLayout',
  component: AppLayout,
  parameters: { layout: 'fullscreen' },
  args: {
    brand: 'Facturation & relances',
    userName: 'Claire Comptable',
    onLogout: fn(),
    nav: [
      { to: '/', label: 'Factures' },
      { to: '/new', label: 'Nouvelle facture' },
      { to: '/reminders', label: 'Relances' },
      { to: '/dashboard', label: 'Tableau de bord' },
    ],
    children: <PageHeader title="Factures" subtitle="10 facture(s)" />,
  },
} satisfies Meta<typeof AppLayout>

export default meta
type Story = StoryObj<typeof meta>

export const Accountant: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    // La page courante est signalée dans la navigation.
    await expect(canvas.getByRole('link', { name: 'Factures' })).toHaveAttribute('aria-current', 'page')
    await userEvent.click(canvas.getByRole('button', { name: 'Déconnexion' }))
    await expect(args.onLogout).toHaveBeenCalledOnce()
  },
}

export const Admin: Story = { args: { userName: 'Admin Démo', admin: true } }

export const Client: Story = {
  args: { userName: 'ACME Industrie', nav: [{ to: '/', label: 'Mes factures' }] },
}
