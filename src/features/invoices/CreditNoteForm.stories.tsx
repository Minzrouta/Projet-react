import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { CreditNoteForm } from './CreditNoteForm'

const meta = {
  title: 'Facturation/CreditNoteForm',
  component: CreditNoteForm,
  args: { onSubmit: fn(async () => true) },
} satisfies Meta<typeof CreditNoteForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByLabelText("Montant de l'avoir"), '120')
    await userEvent.type(canvas.getByLabelText('Motif'), 'Geste commercial')
    await userEvent.click(canvas.getByRole('button', { name: "Créer l'avoir" }))
    await expect(args.onSubmit).toHaveBeenCalledWith({ amount: 120, reason: 'Geste commercial' })
  },
}

export const TooHigh: Story = {
  args: { error: { status: 409, code: 'CREDIT_TOO_HIGH', message: "L'avoir dépasse le reste dû (2240.00 €)", path: '' } },
}
