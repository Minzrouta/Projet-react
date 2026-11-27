import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Alert } from '../components/Alert'
import { Button, ButtonLink } from '../components/Button'
import { Card } from '../components/Card'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ErrorState } from '../components/ErrorState'
import { Grid, ScreenOnly, Stack } from '../components/Layout'
import { Loader } from '../components/Loader'
import { PageHeader } from '../components/PageHeader'
import { ProgressBar } from '../components/ProgressBar'
import { Text } from '../components/Text'
import { useToast } from '../components/Toast'
import { useSession } from '../features/auth/session'
import { CreditNoteForm } from '../features/invoices/CreditNoteForm'
import { METHOD_LABEL } from '../features/invoices/invoice'
import { InvoiceLines } from '../features/invoices/InvoiceLines'
import { InvoiceStatusBadge } from '../features/invoices/InvoiceTable'
import { PaymentForm } from '../features/invoices/PaymentForm'
import { ReminderTrack } from '../features/invoices/ReminderTrack'
import { useAction } from '../hooks/useAction'
import { useQuery } from '../hooks/useQuery'
import { api, type InvoiceDto } from '../lib/api'
import { day, euro, plural } from '../lib/format'

export default function InvoicePage() {
  const { id = '' } = useParams()
  const { accountant } = useSession()
  const invoice = useQuery(`invoice:${id}`, () => api.getInvoice(id))
  const back = { to: '/', label: accountant ? 'Factures' : 'Mes factures' }

  if (!invoice.data) {
    return (
      <>
        <PageHeader title="Facture" back={back} />
        {invoice.error ? <ErrorState error={invoice.error} onRetry={invoice.error.status === 404 ? undefined : invoice.reload} /> : <Loader />}
      </>
    )
  }
  return <InvoiceView invoice={invoice.data} accountant={accountant} back={back} onChange={invoice.setData} />
}

interface InvoiceViewProps {
  invoice: InvoiceDto
  accountant: boolean
  back: { to: string; label: string }
  /** Chaque action de l'API renvoie la facture à jour : on la remonte, sans recharger. */
  onChange: (invoice: InvoiceDto) => void
}

function InvoiceView({ invoice, accountant, back, onChange }: InvoiceViewProps) {
  const navigate = useNavigate()
  const toast = useToast()
  const [confirmIssue, setConfirmIssue] = useState(false)
  const issue = useAction()
  const payment = useAction()
  const credit = useAction()
  const reminder = useAction()
  const duplicate = useAction()

  const draft = invoice.status === 'DRAFT'
  const open = !draft && invoice.remaining > 0
  const headerError = issue.error ?? duplicate.error

  async function apply(action: ReturnType<typeof useAction>, call: () => Promise<InvoiceDto>, done: string): Promise<boolean> {
    const updated = await action.run(call)
    if (!updated) return false
    onChange(updated)
    toast(done)
    return true
  }

  async function handleDuplicate() {
    const lines = invoice.lines.map(({ label, quantity, unitPrice, vatRate }) => ({ label, quantity, unitPrice, vatRate }))
    const copy = await duplicate.run(() => api.createInvoice({ clientId: invoice.clientId, dueDate: invoice.dueDate, lines }))
    if (!copy) return
    toast('Brouillon créé à partir de cette facture')
    navigate(`/invoices/${copy.id}/edit`)
  }

  return (
    <Stack>
      <PageHeader
        title={invoice.number ?? 'Brouillon'}
        adornment={<InvoiceStatusBadge status={invoice.status} />}
        subtitle={
          <>
            {invoice.clientName} · échéance {day(invoice.dueDate)}
            {invoice.issuedAt && ` · émise le ${day(invoice.issuedAt)}`}
            {open && invoice.daysOverdue > 0 && ` · ${plural(invoice.daysOverdue, 'jour')} de retard`}
          </>
        }
        back={back}
        actions={
          <>
            {!draft && <Button onClick={() => window.print()}>Imprimer</Button>}
            {accountant && !draft && (
              <Button onClick={() => void handleDuplicate()} loading={duplicate.pending}>
                Dupliquer
              </Button>
            )}
            {accountant && draft && <ButtonLink to={`/invoices/${invoice.id}/edit`}>Modifier</ButtonLink>}
            {accountant && draft && (
              <Button variant="primary" onClick={() => setConfirmIssue(true)}>
                Émettre
              </Button>
            )}
          </>
        }
      />
      {headerError && <Alert tone="error">{Object.values(headerError.fields ?? {}).join(' · ') || headerError.message}</Alert>}

      <Card>
        <InvoiceLines invoice={invoice} />
        {!draft && <ProgressBar label="Part de la facture déjà réglée ou couverte par un avoir" value={invoice.paid + invoice.credited} max={invoice.totalTtc} tone={open ? 'accent' : 'success'} />}
      </Card>

      {!draft && (
        <ScreenOnly>
          <Grid columns={2}>
            <Card title="Paiements">
              {invoice.payments.length === 0 ? (
                <Text tone="muted" as="p">
                  Aucun paiement.
                </Text>
              ) : (
                <ul>
                  {invoice.payments.map((p) => (
                    <li key={p.id}>
                      {day(p.date)} : {euro(p.amount)} ({METHOD_LABEL[p.method]})
                    </li>
                  ))}
                </ul>
              )}
              {accountant && open && (
                <PaymentForm remaining={invoice.remaining} pending={payment.pending} error={payment.error} onSubmit={(req) => apply(payment, () => api.addPayment(invoice.id, req), 'Paiement enregistré')} />
              )}
            </Card>

            <Card title="Avoirs">
              {invoice.creditNotes.length === 0 ? (
                <Text tone="muted" as="p">
                  Aucun avoir.
                </Text>
              ) : (
                <ul>
                  {invoice.creditNotes.map((c) => (
                    <li key={c.id}>
                      <Text strong>{c.number}</Text> : {euro(c.amount)}, {c.reason}
                    </li>
                  ))}
                </ul>
              )}
              {accountant && open && <CreditNoteForm pending={credit.pending} error={credit.error} onSubmit={(req) => apply(credit, () => api.addCreditNote(invoice.id, req), 'Avoir créé')} />}
            </Card>
          </Grid>

          {accountant && (
            <Card title="Relances">
              {reminder.error && <Alert tone="error">{reminder.error.message}</Alert>}
              <ReminderTrack
                daysOverdue={invoice.daysOverdue}
                reminders={invoice.reminders}
                reminderDue={invoice.reminderDue}
                open={open}
                pending={reminder.pending}
                onSend={(level) => void apply(reminder, () => api.sendReminder(invoice.id, level), `Relance de niveau ${level} enregistrée`)}
              />
            </Card>
          )}
        </ScreenOnly>
      )}

      <ConfirmDialog
        open={confirmIssue}
        title="Émettre cette facture ?"
        confirmLabel="Émettre la facture"
        pending={issue.pending}
        onCancel={() => setConfirmIssue(false)}
        onConfirm={async () => {
          await apply(issue, () => api.issueInvoice(invoice.id), 'Facture émise')
          setConfirmIssue(false)
        }}
      >
        Elle recevra son numéro définitif et ne pourra plus être modifiée : toute correction passera par un avoir.
      </ConfirmDialog>
    </Stack>
  )
}
