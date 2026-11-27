import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Button } from '../Button'
import { ToastProvider, useToast } from './Toast'

function Demo() {
  const toast = useToast()
  return <Button onClick={() => toast('Paiement enregistré')}>Enregistrer</Button>
}

const meta = {
  title: 'Composants/Toast',
  component: ToastProvider,
  args: { children: <Demo /> },
} satisfies Meta<typeof ToastProvider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button'))
    await expect(canvas.getByRole('status')).toHaveTextContent('Paiement enregistré')
  },
}
