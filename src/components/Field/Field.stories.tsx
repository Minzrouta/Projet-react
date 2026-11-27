import { useState, type ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { CheckboxField, SelectField, TextField } from './Field'

const meta = {
  title: 'Composants/Field',
  component: TextField,
  args: { label: 'Email' },
} satisfies Meta<typeof TextField>

export default meta
type Story = StoryObj<typeof meta>

function Controlled(props: ComponentProps<typeof TextField>) {
  const [value, setValue] = useState('')
  return <TextField {...props} value={value} onChange={(e) => setValue(e.target.value)} />
}

export const Default: Story = {
  args: { type: 'email' },
  render: (args) => <Controlled {...args} />,
  play: async ({ canvasElement }) => {
    // Le libellé est relié au champ : on le retrouve par son nom, et la saisie met l'état à jour.
    const input = within(canvasElement).getByLabelText('Email')
    await userEvent.type(input, 'claire@example.com')
    await expect(input).toHaveValue('claire@example.com')
  },
}

export const WithHint: Story = {
  args: { label: 'Mot de passe', type: 'password', hint: '8 à 100 caractères.' },
}

export const WithError: Story = {
  args: { label: 'Montant', type: 'number', defaultValue: '0', error: 'doit être supérieur ou égal à 0.01' },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText('Montant')
    await expect(input).toBeInvalid()
    await expect(input).toHaveAccessibleDescription('doit être supérieur ou égal à 0.01')
  },
}

export const Numeric: Story = { args: { label: 'Quantité', type: 'number', numeric: true, defaultValue: '2' } }

export const Select: Story = {
  render: () => (
    <SelectField label="Moyen de paiement" defaultValue="TRANSFER">
      <option value="TRANSFER">Virement</option>
      <option value="CARD">Carte</option>
      <option value="CHECK">Chèque</option>
    </SelectField>
  ),
}

export const Checkbox: Story = {
  render: () => <CheckboxField label="Compte actif" hint="Un compte désactivé ne peut plus se connecter." defaultChecked />,
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByLabelText('Compte actif')
    await userEvent.click(box)
    await expect(box).not.toBeChecked()
  },
}
