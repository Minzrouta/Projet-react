import { useState } from 'react'
import { Link } from 'react-router'
import { Alert } from '../components/Alert'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { Stack } from '../components/Layout'
import { Loader } from '../components/Loader'
import { PageHeader } from '../components/PageHeader'
import { DataTable, type Column } from '../components/Table'
import { useToast } from '../components/Toast'
import { REMINDER_LEVELS } from '../features/invoices/invoice'
import { useAction } from '../hooks/useAction'
import { useQuery } from '../hooks/useQuery'
import { api, type ReminderDueDto } from '../lib/api'
import { day, euro } from '../lib/format'

export default function RemindersPage() {
  const due = useQuery('reminders', () => api.remindersDue())
  const send = useAction()
  const toast = useToast()
  const [sending, setSending] = useState<string | null>(null)

  async function handleSend(reminder: ReminderDueDto) {
    setSending(reminder.invoiceId)
    const sent = await send.run(() => api.sendReminder(reminder.invoiceId, reminder.level))
    setSending(null)
    if (!sent) return
    toast(`Relance enregistrée pour ${reminder.number}`)
    due.reload()
  }

  const columns: Column<ReminderDueDto>[] = [
    { key: 'invoice', header: 'Facture', cell: (r) => <Link to={`/invoices/${r.invoiceId}`}>{r.number}</Link> },
    { key: 'client', header: 'Client', cell: (r) => r.clientName },
    { key: 'late', header: 'Retard', cell: (r) => `${r.daysOverdue} j (échéance ${day(r.dueDate)})` },
    { key: 'remaining', header: 'Reste dû', numeric: true, strong: true, cell: (r) => euro(r.remaining) },
    {
      key: 'level',
      header: 'Niveau',
      cell: (r) => {
        const level = REMINDER_LEVELS[r.level - 1]
        return (
          <Badge tone={r.level === 3 ? 'danger' : 'warning'}>
            {level.label} (J+{level.days})
          </Badge>
        )
      },
    },
    {
      key: 'action',
      header: 'Action',
      hideHeader: true,
      cell: (r) => (
        <Button variant="primary" size="small" loading={sending === r.invoiceId} disabled={send.pending} aria-label={`Marquer envoyée la relance de ${r.number}`} onClick={() => void handleSend(r)}>
          Marquer envoyée
        </Button>
      ),
    },
  ]

  return (
    <Stack>
      <PageHeader title="Relances à envoyer" />
      {send.error && <Alert tone="error">{send.error.message}</Alert>}
      {due.error && <ErrorState error={due.error} onRetry={due.reload} />}
      {!due.data && !due.error && <Loader />}
      {due.data && (due.data.length === 0 ? <EmptyState>Aucune relance à envoyer.</EmptyState> : <DataTable caption="Relances à envoyer" columns={columns} rows={due.data} rowKey={(r) => r.invoiceId} />)}
    </Stack>
  )
}
