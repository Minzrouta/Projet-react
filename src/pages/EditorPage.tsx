import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Alert } from '../components/Alert'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ErrorState } from '../components/ErrorState'
import { Stack } from '../components/Layout'
import { Loader } from '../components/Loader'
import { PageHeader } from '../components/PageHeader'
import { useToast } from '../components/Toast'
import { InvoiceForm } from '../features/invoices/InvoiceForm'
import { useAction } from '../hooks/useAction'
import { useQuery } from '../hooks/useQuery'
import { api, toApiError, type InvoiceRequest } from '../lib/api'

export default function EditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const save = useAction()
  const [toIssue, setToIssue] = useState<InvoiceRequest | null>(null)

  const clients = useQuery('clients', () => api.clients())
  const draft = useQuery(`draft:${id ?? 'new'}`, async () => (id ? api.getInvoice(id) : null))
  const loadError = clients.error ?? draft.error
  const loading = clients.loading || draft.loading
  const ready = clients.data !== null && !loading && !loadError
  const issued = draft.data !== null && draft.data.status !== 'DRAFT'

  async function submit(request: InvoiceRequest, issue: boolean) {
    const saved = await save.run(() => (id ? api.updateInvoice(id, request) : api.createInvoice(request)))
    if (!saved) return
    if (!issue) {
      toast('Brouillon enregistré')
      navigate(`/invoices/${saved.id}`)
      return
    }
    // Deux appels : si l'émission est refusée, le brouillon reste enregistré et on le dit.
    try {
      await api.issueInvoice(saved.id)
      toast('Facture émise')
    } catch (e) {
      const error = toApiError(e)
      toast(`Brouillon enregistré, émission refusée : ${Object.values(error.fields ?? {}).join(', ') || error.message}`)
    }
    navigate(`/invoices/${saved.id}`)
  }

  return (
    <Stack>
      <PageHeader title={id ? 'Modifier le brouillon' : 'Nouvelle facture'} back={id ? { to: `/invoices/${id}`, label: 'Retour au brouillon' } : { to: '/', label: 'Factures' }} />
      {loadError && (
        <ErrorState
          error={loadError}
          onRetry={() => {
            clients.reload()
            draft.reload()
          }}
        />
      )}
      {!loadError && loading && <Loader />}
      {ready && issued && <Alert tone="warning">Facture émise : elle n'est plus modifiable. Corrigez-la par un avoir depuis sa page.</Alert>}
      {ready && !issued && save.error && !save.error.fields && <Alert tone="error">{save.error.message}</Alert>}
      {ready && !issued && (
        <InvoiceForm
          key={draft.data?.id ?? 'new'}
          clients={clients.data ?? []}
          initial={draft.data ? { clientId: draft.data.clientId, dueDate: draft.data.dueDate, lines: draft.data.lines.map(({ label, quantity, unitPrice, vatRate }) => ({ label, quantity, unitPrice, vatRate })) } : undefined}
          fieldErrors={save.error?.fields}
          pending={save.pending}
          onSubmit={(request, issue) => (issue ? setToIssue(request) : void submit(request, false))}
        />
      )}

      <ConfirmDialog
        open={toIssue !== null}
        title="Enregistrer et émettre ?"
        confirmLabel="Émettre la facture"
        pending={save.pending}
        onCancel={() => setToIssue(null)}
        onConfirm={async () => {
          if (toIssue) await submit(toIssue, true)
          setToIssue(null)
        }}
      >
        La facture recevra son numéro définitif et ne pourra plus être modifiée : toute correction passera par un avoir.
      </ConfirmDialog>
    </Stack>
  )
}
