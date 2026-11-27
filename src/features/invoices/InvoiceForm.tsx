import { useState } from 'react'
import { Button } from '../../components/Button'
import { SelectField, TextField } from '../../components/Field'
import { Grid, Row, Stack } from '../../components/Layout'
import { Table, Td, Th } from '../../components/Table'
import { Text } from '../../components/Text'
import type { InvoiceRequest, UserSummary } from '../../lib/api'
import { euro, isoDate } from '../../lib/format'
import { VAT_RATES, invoiceTotals, lineTotals } from './invoice'

interface LineDraft {
  /** Identifiant créé avec la ligne : c'est la `key` React, stable quand on retire une autre ligne. */
  id: string
  label: string
  quantity: string
  unitPrice: string
  vatRate: number
}

interface FormState {
  clientId: string
  dueDate: string
  lines: LineDraft[]
}

const emptyLine = (): LineDraft => ({ id: crypto.randomUUID(), label: '', quantity: '1', unitPrice: '0', vatRate: 20 })

function toState(initial?: InvoiceRequest): FormState {
  if (!initial) return { clientId: '', dueDate: isoDate(30), lines: [emptyLine()] }
  return {
    clientId: initial.clientId,
    dueDate: initial.dueDate,
    lines: initial.lines.map((l) => ({ id: crypto.randomUUID(), label: l.label, quantity: String(l.quantity), unitPrice: String(l.unitPrice), vatRate: l.vatRate })),
  }
}

const toRequest = (form: FormState): InvoiceRequest => ({
  clientId: form.clientId,
  dueDate: form.dueDate,
  lines: form.lines.map((l) => ({ label: l.label, quantity: Number(l.quantity), unitPrice: Number(l.unitPrice), vatRate: l.vatRate })),
})

interface InvoiceFormProps {
  clients: UserSummary[]
  /** Brouillon existant à modifier. */
  initial?: InvoiceRequest
  /** Erreurs de validation renvoyées par l'API : `clientId`, `dueDate`, `lines[0].label`… */
  fieldErrors?: Record<string, string>
  pending?: boolean
  /** `issue` est vrai quand l'utilisateur a choisi « Enregistrer et émettre ». */
  onSubmit: (request: InvoiceRequest, issue: boolean) => void
}

export function InvoiceForm({ clients, initial, fieldErrors = {}, pending = false, onSubmit }: InvoiceFormProps) {
  const [form, setForm] = useState(() => toState(initial))

  // Les totaux se calculent pendant le rendu : ce ne sont pas des états.
  const request = toRequest(form)
  const totals = invoiceTotals(request.lines)

  const setLine = (id: string, patch: Partial<LineDraft>) => setForm({ ...form, lines: form.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) })

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    onSubmit(request, submitter?.value === 'issue')
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        <Grid columns={2}>
          <SelectField label="Client" required value={form.clientId} error={fieldErrors.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
            <option value="">Choisir un client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName}
              </option>
            ))}
          </SelectField>
          <TextField label="Échéance" type="date" required value={form.dueDate} error={fieldErrors.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        </Grid>

        <Table caption="Lignes de la facture">
          <thead>
            <tr>
              <Th>Désignation</Th>
              <Th numeric>Qté</Th>
              <Th numeric>PU HT (€)</Th>
              <Th numeric>TVA %</Th>
              <Th numeric>Total HT</Th>
              <Th>
                <span className="visually-hidden">Action</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {form.lines.map((line, index) => (
              <tr key={line.id}>
                <Td>
                  <TextField
                    label={`Désignation ${index + 1}`}
                    hideLabel
                    required
                    maxLength={200}
                    value={line.label}
                    error={fieldErrors[`lines[${index}].label`]}
                    onChange={(e) => setLine(line.id, { label: e.target.value })}
                  />
                </Td>
                <Td numeric>
                  <TextField
                    label={`Quantité ${index + 1}`}
                    hideLabel
                    numeric
                    type="number"
                    step="0.01"
                    min={0.01}
                    required
                    value={line.quantity}
                    error={fieldErrors[`lines[${index}].quantity`]}
                    onChange={(e) => setLine(line.id, { quantity: e.target.value })}
                  />
                </Td>
                <Td numeric>
                  <TextField
                    label={`Prix unitaire ${index + 1}`}
                    hideLabel
                    numeric
                    type="number"
                    step="0.01"
                    min={0}
                    required
                    value={line.unitPrice}
                    error={fieldErrors[`lines[${index}].unitPrice`]}
                    onChange={(e) => setLine(line.id, { unitPrice: e.target.value })}
                  />
                </Td>
                <Td numeric>
                  <SelectField label={`TVA ${index + 1}`} hideLabel numeric value={line.vatRate} error={fieldErrors[`lines[${index}].vatRate`]} onChange={(e) => setLine(line.id, { vatRate: Number(e.target.value) })}>
                    {VAT_RATES.map((rate) => (
                      <option key={rate} value={rate}>
                        {rate} %
                      </option>
                    ))}
                  </SelectField>
                </Td>
                <Td numeric>{euro(lineTotals(request.lines[index]).ht)}</Td>
                <Td>
                  <Button variant="ghost" size="small" aria-label={`Retirer la ligne ${index + 1}`} disabled={form.lines.length === 1} onClick={() => setForm({ ...form, lines: form.lines.filter((l) => l.id !== line.id) })}>
                    ✕
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <Td colSpan={4}>Total HT</Td>
              <Td numeric>{euro(totals.ht)}</Td>
              <Td />
            </tr>
            <tr>
              <Td colSpan={4}>TVA</Td>
              <Td numeric>{euro(totals.vat)}</Td>
              <Td />
            </tr>
            <tr>
              <Td colSpan={4} strong>
                Total TTC
              </Td>
              <Td numeric strong>
                {euro(totals.ttc)}
              </Td>
              <Td />
            </tr>
          </tfoot>
        </Table>
        {fieldErrors.lines && (
          <Text tone="danger" as="p">
            {fieldErrors.lines}
          </Text>
        )}

        <Row>
          <Button size="small" disabled={form.lines.length >= 50} onClick={() => setForm({ ...form, lines: [...form.lines, emptyLine()] })}>
            + Ligne
          </Button>
        </Row>
        <Row>
          <Button type="submit" value="draft" disabled={pending}>
            Enregistrer le brouillon
          </Button>
          <Button type="submit" value="issue" variant="primary" disabled={pending}>
            Enregistrer et émettre
          </Button>
        </Row>
        <Text tone="muted" size="small" as="p">
          Une fois émise, la facture reçoit son numéro définitif et ne peut plus être modifiée : toute correction passe par un avoir.
        </Text>
      </Stack>
    </form>
  )
}
