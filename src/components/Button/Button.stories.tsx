import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Button, ButtonLink } from './Button'

const meta = {
  title: 'Composants/Button',
  component: Button,
  args: { children: 'Enregistrer le brouillon', onClick: fn() },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Primary: Story = {
  args: { variant: 'primary', children: 'Émettre' },
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Émettre' }))
    await expect(args.onClick).toHaveBeenCalledOnce()
  },
}

export const Danger: Story = { args: { variant: 'danger', children: 'Supprimer' } }
export const Ghost: Story = { args: { variant: 'ghost', children: 'Déconnexion' } }
export const Small: Story = { args: { size: 'small', children: 'Solde' } }
export const Disabled: Story = { args: { variant: 'primary', disabled: true } }

export const Loading: Story = {
  args: { variant: 'primary', loading: true, children: 'Connexion…' },
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole('button')
    await expect(button).toBeDisabled()
    await userEvent.click(button, { pointerEventsCheck: 0 })
    await expect(args.onClick).not.toHaveBeenCalled()
  },
}

export const AsLink: Story = {
  name: 'Lien (ButtonLink)',
  render: () => (
    <ButtonLink to="/new" variant="primary">
      Nouvelle facture
    </ButtonLink>
  ),
}
