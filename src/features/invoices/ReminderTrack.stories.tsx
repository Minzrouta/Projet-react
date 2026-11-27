import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { ReminderTrack } from './ReminderTrack'

const first = { level: 1, sentAt: '2026-11-14T10:00:00Z', sentByName: 'Claire Comptable' }

const meta = {
  title: 'Facturation/ReminderTrack',
  component: ReminderTrack,
  args: { daysOverdue: 20, reminders: [first], reminderDue: 2, open: true, onSend: fn() },
} satisfies Meta<typeof ReminderTrack>

export default meta
type Story = StoryObj<typeof meta>

export const SecondLevelDue: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Envoyée le 14/11/2026 par Claire Comptable')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Enregistrer la relance de niveau 2' }))
    await expect(args.onSend).toHaveBeenCalledWith(2)
  },
}

export const NotOverdueYet: Story = { args: { daysOverdue: 0, reminders: [], reminderDue: null } }
export const WaitingForNextLevel: Story = { args: { daysOverdue: 9, reminders: [first], reminderDue: null } }
export const Settled: Story = { args: { daysOverdue: 40, reminders: [first], reminderDue: null, open: false } }
