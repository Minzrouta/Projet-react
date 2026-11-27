import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { UserTable } from './UserTable'

const users = [
  { id: 'u-admin', email: 'admin@example.com', displayName: 'Admin Démo', role: 'ADMIN' as const, enabled: true },
  { id: 'u-claire', email: 'claire@example.com', displayName: 'Claire Comptable', role: 'USER' as const, enabled: true },
  { id: 'u-old', email: 'ancien@example.com', displayName: 'Ancien Compte', role: 'USER' as const, enabled: false },
]

const meta = {
  title: 'Utilisateurs/UserTable',
  component: UserTable,
  args: { users, accountantIds: ['u-claire'], currentUserId: 'u-admin', onDelete: fn() },
} satisfies Meta<typeof UserTable>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    // On ne peut pas supprimer son propre compte.
    await expect(canvas.getByRole('button', { name: 'Supprimer Admin Démo' })).toBeDisabled()
    await userEvent.click(canvas.getByRole('button', { name: 'Supprimer Claire Comptable' }))
    await expect(args.onDelete).toHaveBeenCalledWith(users[1])
    await expect(canvas.getByRole('link', { name: 'Modifier Claire Comptable' })).toHaveAttribute('href', '/users/u-claire/edit')
  },
}
