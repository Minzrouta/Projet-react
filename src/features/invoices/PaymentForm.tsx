import { useState } from 'react'
import { Alert } from '../../components/Alert'
import { Button } from '../../components/Button'
import { SelectField, TextField } from '../../components/Field'
import { Row, Stack } from '../../components/Layout'
import type { ApiError, PaymentMethod, PaymentRequest } from '../../lib/api'
import { isoDate } from '../../lib/format'
import { METHOD_LABEL } from './invoice'

interface PaymentFormProps {
  /** Reste dû, proposé par le bouton « Solde ». */
  remaining: number
  pending?: boolean
  error?: ApiError | null
  /** Renvoie vrai si le paiement a été accepté : le montant se vide alors. */
  onSubmit: (payment: PaymentRequest) => Promise<boolean>
}

export function PaymentForm({ remaining, pending = false, error, onSubmit }: PaymentFormProps) {
  const [form, setForm] = useState({ date: isoDate(), amount: '', method: 'TRANSFER' as PaymentMethod })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const accepted = await onSubmit({ ...form, amount: Number(form.amount) })
    if (accepted) setForm((f) => ({ ...f, amount: '' }))
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="small">
        {error && !error.fields && <Alert tone="error">{error.message}</Alert>}
        <Row align="end">
          <TextField label="Date" type="date" required max={isoDate()} value={form.date} error={error?.fields?.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <TextField label="Montant" numeric type="number" step="0.01" min={0.01} required value={form.amount} error={error?.fields?.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <SelectField label="Moyen" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as PaymentMethod })}>
            {(Object.keys(METHOD_LABEL) as PaymentMethod[]).map((method) => (
              <option key={method} value={method}>
                {METHOD_LABEL[method]}
              </option>
            ))}
          </SelectField>
        </Row>
        <Row>
          <Button type="submit" variant="primary" size="small" loading={pending}>
            Enregistrer
          </Button>
          <Button variant="ghost" size="small" onClick={() => setForm({ ...form, amount: String(remaining) })}>
            Solde
          </Button>
        </Row>
      </Stack>
    </form>
  )
}
