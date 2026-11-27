import { useNavigate, useParams } from 'react-router'
import { Card } from '../components/Card'
import { ErrorState } from '../components/ErrorState'
import { Narrow } from '../components/Layout'
import { Loader } from '../components/Loader'
import { PageHeader } from '../components/PageHeader'
import { useToast } from '../components/Toast'
import { UserForm, type UserFormValues } from '../features/users/UserForm'
import { useAction } from '../hooks/useAction'
import { useQuery } from '../hooks/useQuery'
import { api } from '../lib/api'

/** Création (`/users/new`) ou modification (`/users/:id/edit`) d'un utilisateur. */
export default function UserFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const save = useAction()
  const existing = useQuery(`user:${id ?? 'new'}`, async () => {
    if (!id) return null
    const [user, roles] = await Promise.all([api.getUser(id), api.listRoles()])
    return { user, accountant: roles.some((r) => r.userId === id && r.role === 'ACCOUNTANT') }
  })

  async function submit(values: UserFormValues) {
    const { email, displayName, role, enabled, password, accountant } = values
    const done = await save.run(async () => {
      const user = id ? await api.updateUser(id, { email, displayName, role, enabled }) : await api.createUser({ email, displayName, role, password })
      // Le rôle comptable est porté par l'application Facturation, pas par le compte : second appel.
      const wasAccountant = existing.data?.accountant ?? false
      const wanted = role !== 'ADMIN' && accountant
      if (wanted && !wasAccountant) await api.grantAccountant(user.id)
      if (!wanted && wasAccountant) await api.revokeAccountant(user.id)
      return user
    })
    if (!done) return
    toast(id ? `${done.displayName} a été modifié` : `${done.displayName} a été créé`)
    navigate('/users')
  }

  return (
    <Narrow>
      <PageHeader title={id ? "Modifier l'utilisateur" : 'Nouvel utilisateur'} back={{ to: '/users', label: 'Utilisateurs' }} />
      {existing.error && <ErrorState error={existing.error} onRetry={existing.error.status === 404 ? undefined : existing.reload} />}
      {existing.loading && !existing.error && <Loader />}
      {!existing.loading && !existing.error && (
        <Card>
          <UserForm key={existing.data?.user.id ?? 'new'} user={existing.data?.user} accountant={existing.data?.accountant} pending={save.pending} error={save.error} cancelTo="/users" onSubmit={(values) => void submit(values)} />
        </Card>
      )}
    </Narrow>
  )
}
