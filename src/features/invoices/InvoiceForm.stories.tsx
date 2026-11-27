import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { clients } from './fixtures'
import { InvoiceForm } from './InvoiceForm'

const meta = {
  title: 'Facturation/InvoiceForm',
  component: InvoiceForm,
  args: { clients, onSubmit: fn() },
} satisfies Meta<typeof InvoiceForm>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.selectOptions(canvas.getByLabelText('Client'), 'u-globex')
    await userEvent.type(canvas.getByLabelText('Désignation 1'), 'Formation React')
    await userEvent.clear(canvas.getByLabelText('Quantité 1'))
    await userEvent.type(canvas.getByLabelText('Quantité 1'), '2')
    await userEvent.clear(canvas.getByLabelText('Prix unitaire 1'))
    await userEvent.type(canvas.getByLabelText('Prix unitaire 1'), '650')

    // Les totaux suivent la saisie : 2 x 650 = 1 300 HT, 260 de TVA, 1 560 TTC.
    await expect(canvas.getByRole('row', { name: /Total TTC/ })).toHaveTextContent(/1\s560,00/)

    await userEvent.click(canvas.getByRole('button', { name: 'Enregistrer le brouillon' }))
    await expect(args.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 'u-globex', lines: [{ label: 'Formation React', quantity: 2, unitPrice: 650, vatRate: 20 }] }),
      false,
    )
  },
}

export const AddAndRemoveLines: Story = {
  args: {
    initial: {
      clientId: 'u-acme',
      dueDate: '2026-12-31',
      lines: [
        { label: 'Audit', quantity: 1, unitPrice: 900, vatRate: 20 },
        { label: 'Déplacement', quantity: 1, unitPrice: 100, vatRate: 10 },
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '+ Ligne' }))
    await expect(canvas.getAllByLabelText(/^Désignation/)).toHaveLength(3)

    // Retirer la première ligne garde la saisie des suivantes (clé stable, pas l'index).
    await userEvent.click(canvas.getByRole('button', { name: 'Retirer la ligne 1' }))
    await expect(canvas.getByLabelText('Désignation 1')).toHaveValue('Déplacement')
    await expect(canvas.getByRole('row', { name: /Total TTC/ })).toHaveTextContent('110,00')
  },
}

export const ServerValidationErrors: Story = {
  args: {
    initial: { clientId: 'u-acme', dueDate: '2026-01-01', lines: [{ label: '', quantity: 0, unitPrice: 10, vatRate: 20 }] },
    fieldErrors: { dueDate: "ne doit pas être passée à l'émission", 'lines[0].label': 'ne doit pas être vide', 'lines[0].quantity': 'doit être supérieur ou égal à 0.01' },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('Échéance')).toHaveAccessibleDescription("ne doit pas être passée à l'émission")
    await expect(canvas.getByLabelText('Désignation 1')).toBeInvalid()
  },
}
