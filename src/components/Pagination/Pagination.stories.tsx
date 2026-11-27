import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Pagination } from './Pagination'

const meta = {
  title: 'Composants/Pagination',
  component: Pagination,
  args: { page: 0, totalPages: 3, onChange: fn() },
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

export const FirstPage: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Précédente' })).toBeDisabled()
    await userEvent.click(canvas.getByRole('button', { name: 'Suivante' }))
    await expect(args.onChange).toHaveBeenCalledWith(1)
  },
}

export const LastPage: Story = { args: { page: 2 } }
