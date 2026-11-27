import { Alert } from '../components/Alert'
import { Card } from '../components/Card'
import { ErrorState } from '../components/ErrorState'
import { Narrow } from '../components/Layout'
import { Loader } from '../components/Loader'
import { PageHeader } from '../components/PageHeader'
import { useToast } from '../components/Toast'
import { SimulationPanel } from '../features/simulation/SimulationPanel'
import { useAction } from '../hooks/useAction'
import { useQuery } from '../hooks/useQuery'
import { api, type SimulationDto } from '../lib/api'

export default function SimulationPage() {
  const toast = useToast()
  const simulation = useQuery('simulation', () => api.getSimulation())
  const action = useAction()

  async function apply(call: () => Promise<SimulationDto>, done: string) {
    const updated = await action.run(call)
    if (!updated) return
    simulation.setData(updated)
    toast(done)
  }

  return (
    <Narrow>
      <PageHeader title="Simulation de l'API" subtitle="Ralentit l'API ou la fait échouer pour vérifier les états de chargement, les messages d'erreur et les boutons « Réessayer »." />
      {simulation.error && <ErrorState error={simulation.error} onRetry={simulation.reload} />}
      {action.error && <Alert tone="error">{Object.values(action.error.fields ?? {}).join(' · ') || action.error.message}</Alert>}
      {!simulation.data && !simulation.error && <Loader />}
      {simulation.data && (
        <Card>
          <SimulationPanel
            key={JSON.stringify(simulation.data.failure)}
            simulation={simulation.data}
            pending={action.pending}
            onLatency={(level) => void apply(() => api.setLatency(level), 'Latence réglée')}
            onFailure={(request) => void apply(() => api.setFailure(request), request.mode === 'NONE' ? 'Pannes désactivées' : 'Pannes activées')}
            onReset={() => void apply(() => api.resetSimulation(), 'Simulation remise à zéro')}
          />
        </Card>
      )}
    </Narrow>
  )
}
