import { useState } from 'react'
import { Alert } from '../../components/Alert'
import { Button } from '../../components/Button'
import { TextField } from '../../components/Field'
import { Row, Stack } from '../../components/Layout'
import type { ApiError, CreditRequest } from '../../lib/api'

interface CreditNoteFormProps {
  pending?: boolean
  error?: ApiError | null
  /** Renvoie vrai si l'avoir a été créé : le formulaire se vide alors. */
  onSubmit: (credit: CreditRequest) => Promise<boolean>
}

export function CreditNoteForm({ pending = false, error, onSubmit }: CreditNoteFormProps) {
  const [form, setForm] = useState({ amount: '', reason: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const accepted = await onSubmit({ amount: Number(form.amount), reason: form.reason })
    if (accepted) setForm({ amount: '', reason: '' })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="small">
        {error && !error.fields && <Alert tone="error">{error.message}</Alert>}
        <Row align="end">
          <TextField label="Montant de l'avoir" numeric type="number" step="0.01" min={0.01} required value={form.amount} error={error?.fields?.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <TextField label="Motif" required maxLength={500} value={form.reason} error={error?.fields?.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        </Row>
        <Row>
          <Button type="submit" size="small" loading={pending}>
            Créer l'avoir
          </Button>
        </Row>
      </Stack>
    </form>
  )
}
