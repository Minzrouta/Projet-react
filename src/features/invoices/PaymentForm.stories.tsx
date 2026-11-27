import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { PaymentForm } from './PaymentForm'

const meta = {
  title: 'Facturation/PaymentForm',
  component: PaymentForm,
  args: { remaining: 2240, onSubmit: fn(async () => true) },
} satisfies Meta<typeof PaymentForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    // « Solde » préremplit le reste dû, et le montant se vide une fois le paiement accepté.
    await userEvent.click(canvas.getByRole('button', { name: 'Solde' }))
    await expect(canvas.getByLabelText('Montant')).toHaveValue(2240)
    await userEvent.selectOptions(canvas.getByLabelText('Moyen'), 'CHECK')
    await userEvent.click(canvas.getByRole('button', { name: 'Enregistrer' }))
    await expect(args.onSubmit).toHaveBeenCalledWith(expect.objectContaining({ amount: 2240, method: 'CHECK' }))
    await waitFor(() => expect(canvas.getByLabelText('Montant')).toHaveValue(null))
  },
}

export const Overpayment: Story = {
  args: { error: { status: 409, code: 'OVERPAYMENT', message: 'Le paiement dépasse le reste dû (2240.00 €)', path: '' } },
}

export const FieldError: Story = {
  args: { error: { status: 400, code: 'VALIDATION_ERROR', message: 'Données invalides', path: '', fields: { date: 'ne doit pas être dans le futur' } } },
}

export const Pending: Story = { args: { pending: true } }
