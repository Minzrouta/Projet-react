import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { ButtonLink } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { SelectField, TextField } from '../components/Field'
import { Loader } from '../components/Loader'
import { PageHeader } from '../components/PageHeader'
import { useSession } from '../features/auth/session'
import { STATUSES, STATUS_LABEL } from '../features/invoices/invoice'
import { InvoiceTable } from '../features/invoices/InvoiceTable'
import { useQuery } from '../hooks/useQuery'
import { api, type InvoiceStatus } from '../lib/api'
import { plural } from '../lib/format'

export default function InvoicesPage() {
  const { accountant } = useSession()
  // Le filtre vit dans l'URL : il survit au rechargement et se partage par lien.
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const requested = params.get('status') ?? ''
  const status = (STATUSES as string[]).includes(requested) ? (requested as InvoiceStatus) : undefined
  const invoices = useQuery(`invoices:${status ?? ''}`, () => api.listInvoices({ status }))

  const title = accountant ? 'Factures' : 'Mes factures'
  // La recherche filtre la liste déjà chargée : c'est une donnée dérivée, pas un état de plus.
  const needle = search.trim().toLowerCase()
  const visible = (invoices.data ?? []).filter((i) => !needle || `${i.number ?? 'brouillon'} ${i.clientName}`.toLowerCase().includes(needle))

  return (
    <>
      <PageHeader
        title={title}
        subtitle={invoices.data ? plural(visible.length, 'facture') : '…'}
        actions={
          <>
            <TextField label="Rechercher une facture" hideLabel type="search" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <SelectField label="Statut" hideLabel value={status ?? ''} onChange={(e) => setParams(e.target.value ? { status: e.target.value } : {}, { replace: true })}>
              <option value="">Tous les statuts</option>
              {STATUSES.filter((s) => accountant || s !== 'DRAFT').map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </SelectField>
            {accountant && (
              <ButtonLink to="/new" variant="primary">
                Nouvelle facture
              </ButtonLink>
            )}
          </>
        }
      />
      {invoices.error && <ErrorState error={invoices.error} onRetry={invoices.reload} />}
      {invoices.loading && !invoices.error && <Loader />}
      {invoices.data && !invoices.loading && (visible.length > 0 ? <InvoiceTable caption={title} invoices={visible} showClient={accountant} /> : <EmptyState>Aucune facture.</EmptyState>)}
    </>
  )
}
