import { useEffect, useState } from 'react'
import { Alert } from '../components/Alert'
import { ButtonLink } from '../components/Button'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { TextField } from '../components/Field'
import { Loader } from '../components/Loader'
import { PageHeader } from '../components/PageHeader'
import { Pagination } from '../components/Pagination'
import { useToast } from '../components/Toast'
import { useSession } from '../features/auth/session'
import { UserTable } from '../features/users/UserTable'
import { useAction } from '../hooks/useAction'
import { useQuery } from '../hooks/useQuery'
import { api, type UserDto } from '../lib/api'
import { plural } from '../lib/format'

const PAGE_SIZE = 10

export default function UsersPage() {
  const { user: me } = useSession()
  const toast = useToast()
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [toDelete, setToDelete] = useState<UserDto | null>(null)
  const remove = useAction()

  // La recherche est faite par l'API : on attend une pause dans la frappe avant de la lancer.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(input.trim())
      setPage(0)
    }, 300)
    return () => clearTimeout(timer)
  }, [input])

  const users = useQuery(`users:${search}:${page}`, () => api.listUsers({ page, size: PAGE_SIZE, search: search || undefined }))
  const roles = useQuery('roles', () => api.listRoles())

  async function handleDelete(user: UserDto) {
    const done = await remove.run(async () => {
      await api.deleteUser(user.id)
      return true
    })
    setToDelete(null)
    if (!done) return
    toast(`${user.displayName} a été supprimé`)
    // Si la page vient de se vider, on recule d'une page.
    if (users.data?.content.length === 1 && page > 0) setPage(page - 1)
    else users.reload()
  }

  return (
    <>
      <PageHeader
        title="Utilisateurs"
        subtitle={users.data ? plural(users.data.totalElements, 'utilisateur') : '…'}
        actions={
          <>
            <TextField label="Rechercher un utilisateur" hideLabel type="search" placeholder="Nom ou email…" value={input} onChange={(e) => setInput(e.target.value)} />
            <ButtonLink to="/users/new" variant="primary">
              Nouvel utilisateur
            </ButtonLink>
          </>
        }
      />
      {remove.error && <Alert tone="error">{remove.error.message}</Alert>}
      {users.error && <ErrorState error={users.error} onRetry={users.reload} />}
      {!users.data && !users.error && <Loader />}
      {users.data && users.data.content.length === 0 && <EmptyState>Aucun utilisateur ne correspond.</EmptyState>}
      {users.data && users.data.content.length > 0 && (
        <>
          <UserTable users={users.data.content} accountantIds={(roles.data ?? []).filter((r) => r.role === 'ACCOUNTANT').map((r) => r.userId)} currentUserId={me.id} onDelete={setToDelete} />
          <Pagination page={users.data.page} totalPages={users.data.totalPages} onChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Supprimer cet utilisateur ?"
        confirmLabel="Supprimer"
        confirmVariant="danger"
        pending={remove.pending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && void handleDelete(toDelete)}
      >
        Le compte de {toDelete?.displayName} sera supprimé définitivement.
      </ConfirmDialog>
    </>
  )
}
