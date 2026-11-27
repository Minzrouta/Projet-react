import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { SimulationPanel } from './SimulationPanel'

const meta = {
  title: 'Simulation/SimulationPanel',
  component: SimulationPanel,
  args: {
    simulation: { latency: 'NORMAL', failure: { mode: 'NONE', status: null, rate: 100 } },
    onLatency: fn(),
    onFailure: fn(),
    onReset: fn(),
  },
} satisfies Meta<typeof SimulationPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Idle: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.selectOptions(canvas.getByLabelText('Latence ajoutée à chaque requête'), 'LOW')
    await expect(args.onLatency).toHaveBeenCalledWith('LOW')

    // Le code HTTP n'est demandé qu'en mode « toujours le même code ».
    await expect(canvas.queryByLabelText('Code HTTP renvoyé')).not.toBeInTheDocument()
    await userEvent.selectOptions(canvas.getByLabelText('Pannes'), 'FIXED')
    await userEvent.selectOptions(canvas.getByLabelText('Code HTTP renvoyé'), '500')
    await userEvent.click(canvas.getByRole('button', { name: 'Appliquer les pannes' }))
    await expect(args.onFailure).toHaveBeenCalledWith({ mode: 'FIXED', status: 500, rate: 100 })
  },
}

export const Active: Story = {
  args: { simulation: { latency: 'LOW', failure: { mode: 'RANDOM', status: null, rate: 30 } } },
}
