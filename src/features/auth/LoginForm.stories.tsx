import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { LoginForm } from './LoginForm'

const meta = {
  title: 'Authentification/LoginForm',
  component: LoginForm,
  args: { onSubmit: fn() },
} satisfies Meta<typeof LoginForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByLabelText('Email'), 'claire@example.com')
    await userEvent.type(canvas.getByLabelText('Mot de passe'), 'claire123')
    await userEvent.click(canvas.getByRole('button', { name: 'Se connecter' }))
    await expect(args.onSubmit).toHaveBeenCalledWith({ email: 'claire@example.com', password: 'claire123' })
  },
}

export const Prefilled: Story = { args: { initial: { email: 'acme@example.com', password: 'acme123' } } }
export const WrongPassword: Story = { args: { error: 'Email ou mot de passe incorrect' } }
export const Pending: Story = { args: { pending: true } }
