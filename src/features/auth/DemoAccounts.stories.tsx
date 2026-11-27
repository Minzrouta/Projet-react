import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { DemoAccounts } from './DemoAccounts'

const accounts = [
  { email: 'admin@example.com', password: 'admin123', displayName: 'Admin Démo', role: 'ADMIN' as const, note: "comptable d'office" },
  { email: 'acme@example.com', password: 'acme123', displayName: 'ACME Industrie', role: 'USER' as const, note: 'client, des factures en retard' },
]

const meta = {
  title: 'Authentification/DemoAccounts',
  component: DemoAccounts,
  args: { accounts, onUse: fn() },
} satisfies Meta<typeof DemoAccounts>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Utiliser le compte ACME Industrie' }))
    await expect(args.onUse).toHaveBeenCalledWith(accounts[1])
  },
}
