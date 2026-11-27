import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Button } from '../Button'
import { ConfirmDialog } from './ConfirmDialog'

const meta = {
  title: 'Composants/ConfirmDialog',
  component: ConfirmDialog,
  args: {
    open: false,
    title: 'Émettre cette facture ?',
    children: 'Elle recevra son numéro définitif et ne pourra plus être modifiée : toute correction passera par un avoir.',
    confirmLabel: 'Émettre',
    onConfirm: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof ConfirmDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          Émettre la facture
        </Button>
        <ConfirmDialog
          {...args}
          open={open}
          onCancel={() => {
            setOpen(false)
            args.onCancel()
          }}
          onConfirm={() => {
            setOpen(false)
            args.onConfirm()
          }}
        />
      </>
    )
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Émettre la facture' }))
    const dialog = canvas.getByRole('dialog', { name: 'Émettre cette facture ?' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Émettre' }))
    await expect(args.onConfirm).toHaveBeenCalledOnce()
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument()
  },
}

export const Destructive: Story = {
  args: { open: true, title: 'Supprimer cet utilisateur ?', children: 'Le compte de Bob Martin sera supprimé définitivement.', confirmLabel: 'Supprimer', confirmVariant: 'danger' },
}
