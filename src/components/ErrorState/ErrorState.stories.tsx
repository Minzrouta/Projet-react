import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { ErrorState } from './ErrorState'

const meta = {
  title: 'Composants/ErrorState',
  component: ErrorState,
  args: { onRetry: fn() },
} satisfies Meta<typeof ErrorState>

export default meta
type Story = StoryObj<typeof meta>

export const ServerError: Story = {
  args: { error: { status: 500, code: 'SIMULATED_ERROR', message: 'Erreur simulée (HTTP 500) : la simulation de pannes est active', path: '/api/invoices' } },
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Réessayer' }))
    await expect(args.onRetry).toHaveBeenCalledOnce()
  },
}

export const Offline: Story = {
  args: { error: { status: 0, code: 'NETWORK_ERROR', message: 'Serveur injoignable. Vérifiez votre connexion.', path: '/api/invoices' } },
}

export const WithoutRetry: Story = {
  args: { error: { status: 404, code: 'NOT_FOUND', message: 'Facture introuvable', path: '/api/invoices/42' }, onRetry: undefined },
}

export const RetryAfter: Story = {
  args: { error: { status: 503, code: 'SIMULATED_ERROR', message: 'Erreur simulée (HTTP 503)', path: '/api/invoices', retryAfter: 2 } },
  play: async ({ canvasElement }) => {
    // Le bouton reste bloqué pendant le délai demandé par le serveur, puis se libère.
    const button = within(canvasElement).getByRole('button')
    await expect(button).toBeDisabled()
    await waitFor(() => expect(button).toBeEnabled(), { timeout: 4000 })
    await expect(button).toHaveTextContent('Réessayer')
  },
}
