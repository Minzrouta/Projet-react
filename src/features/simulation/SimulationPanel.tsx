import { useState } from 'react'
import { Button } from '../../components/Button'
import { SelectField, TextField } from '../../components/Field'
import { Row, Stack } from '../../components/Layout'
import { FAILURE_STATUSES, type FailureMode, type FailureRequest, type LatencyLevel, type SimulationDto } from '../../lib/api'

const LATENCY_LABEL: Record<LatencyLevel, string> = {
  NORMAL: 'Aucune',
  LOW: 'Faible (1 s)',
  MEDIUM: 'Moyenne (10 s)',
  HIGH: 'Forte (60 s)',
}

const MODE_LABEL: Record<FailureMode, string> = {
  NONE: 'Aucune panne',
  FIXED: 'Toujours le même code',
  RANDOM: 'Code tiré au hasard',
}

interface SimulationPanelProps {
  /** Réglage courant renvoyé par l'API. */
  simulation: SimulationDto
  pending?: boolean
  onLatency: (level: LatencyLevel) => void
  onFailure: (request: FailureRequest) => void
  onReset: () => void
}

/** Réglage de la latence et des pannes simulées de l'API, pour éprouver les états de chargement et d'erreur. */
export function SimulationPanel({ simulation, pending = false, onLatency, onFailure, onReset }: SimulationPanelProps) {
  const [failure, setFailure] = useState({ mode: simulation.failure.mode, status: simulation.failure.status ?? 503, rate: String(simulation.failure.rate) })
  const active = simulation.latency !== 'NORMAL' || simulation.failure.mode !== 'NONE'

  function handleFailure(e: React.FormEvent) {
    e.preventDefault()
    onFailure({ mode: failure.mode, ...(failure.mode === 'NONE' ? {} : { rate: Number(failure.rate) }), ...(failure.mode === 'FIXED' ? { status: failure.status } : {}) })
  }

  return (
    <Stack>
      <SelectField label="Latence ajoutée à chaque requête" value={simulation.latency} disabled={pending} onChange={(e) => onLatency(e.target.value as LatencyLevel)}>
        {(Object.keys(LATENCY_LABEL) as LatencyLevel[]).map((level) => (
          <option key={level} value={level}>
            {LATENCY_LABEL[level]}
          </option>
        ))}
      </SelectField>

      <form onSubmit={handleFailure}>
        <Stack>
          <Row align="end">
            <SelectField label="Pannes" value={failure.mode} onChange={(e) => setFailure({ ...failure, mode: e.target.value as FailureMode })}>
              {(Object.keys(MODE_LABEL) as FailureMode[]).map((mode) => (
                <option key={mode} value={mode}>
                  {MODE_LABEL[mode]}
                </option>
              ))}
            </SelectField>
            {failure.mode === 'FIXED' && (
              <SelectField label="Code HTTP renvoyé" value={failure.status} onChange={(e) => setFailure({ ...failure, status: Number(e.target.value) })}>
                {FAILURE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </SelectField>
            )}
            {failure.mode !== 'NONE' && (
              <TextField label="Requêtes en panne (%)" numeric type="number" min={1} max={100} required value={failure.rate} onChange={(e) => setFailure({ ...failure, rate: e.target.value })} />
            )}
          </Row>
          <Row>
            <Button type="submit" variant="primary" loading={pending}>
              Appliquer les pannes
            </Button>
            <Button disabled={!active || pending} onClick={onReset}>
              Tout remettre à zéro
            </Button>
          </Row>
        </Stack>
      </form>
    </Stack>
  )
}
