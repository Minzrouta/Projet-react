import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { UserForm } from './UserForm'

const bob = { id: 'u-bob', email: 'bob@example.com', displayName: 'Bob Martin', role: 'USER' as const, enabled: true }

const meta = {
  title: 'Utilisateurs/UserForm',
  component: UserForm,
  args: { cancelTo: '/users', onSubmit: fn() },
} satisfies Meta<typeof UserForm>

export default meta
type Story = StoryObj<typeof meta>

export const Create: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByLabelText('Nom affiché'), 'Dana Leroy')
    await userEvent.type(canvas.getByLabelText('Email'), 'dana@example.com')
    await userEvent.type(canvas.getByLabelText('Mot de passe initial'), 'motdepasse123')
    await userEvent.click(canvas.getByLabelText('Service comptable'))
    await userEvent.click(canvas.getByRole('button', { name: "Créer l'utilisateur" }))
    await expect(args.onSubmit).toHaveBeenCalledWith({ displayName: 'Dana Leroy', email: 'dana@example.com', password: 'motdepasse123', role: 'USER', enabled: true, accountant: true })
  },
}

export const Edit: Story = {
  args: { user: bob, accountant: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // En modification : pas de mot de passe, mais l'état du compte.
    await expect(canvas.queryByLabelText('Mot de passe initial')).not.toBeInTheDocument()
    await expect(canvas.getByLabelText('Compte actif')).toBeChecked()
    // Un administrateur est comptable d'office : la case se coche et se verrouille.
    await userEvent.selectOptions(canvas.getByLabelText('Rôle'), 'ADMIN')
    await expect(canvas.getByLabelText('Service comptable')).toBeDisabled()
  },
}

export const EmailAlreadyUsed: Story = {
  args: { user: bob, error: { status: 409, code: 'EMAIL_ALREADY_USED', message: 'Cette adresse e-mail est déjà utilisée', path: '/api/users' } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByLabelText('Email')).toHaveAccessibleDescription('Cette adresse e-mail est déjà utilisée')
  },
}

export const LastAdmin: Story = {
  args: { user: { ...bob, role: 'ADMIN' }, error: { status: 409, code: 'LAST_ADMIN_REQUIRED', message: "L'application doit conserver au moins un administrateur actif", path: '/api/users/u-bob' } },
}
