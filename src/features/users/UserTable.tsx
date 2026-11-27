import { Badge } from '../../components/Badge'
import { Button, ButtonLink } from '../../components/Button'
import { Row } from '../../components/Layout'
import { DataTable, type Column } from '../../components/Table'
import type { UserDto } from '../../lib/api'

interface UserTableProps {
  users: UserDto[]
  /** Identifiants des utilisateurs qui ont le rôle comptable. */
  accountantIds: string[]
  /** L'utilisateur connecté : il ne peut pas se supprimer lui-même. */
  currentUserId: string
  onDelete: (user: UserDto) => void
}

export function UserTable({ users, accountantIds, currentUserId, onDelete }: UserTableProps) {
  const columns: Column<UserDto>[] = [
    { key: 'name', header: 'Nom', cell: (u) => u.displayName },
    { key: 'email', header: 'Email', cell: (u) => u.email },
    {
      key: 'role',
      header: 'Rôle',
      cell: (u) => (
        <>
          {u.role === 'ADMIN' ? <Badge tone="accent">admin</Badge> : <Badge>utilisateur</Badge>}
          {u.role !== 'ADMIN' && accountantIds.includes(u.id) && <Badge tone="info">comptable</Badge>}
        </>
      ),
    },
    { key: 'status', header: 'Statut', cell: (u) => (u.enabled ? <Badge tone="success">actif</Badge> : <Badge tone="warning">désactivé</Badge>) },
    {
      key: 'actions',
      header: 'Actions',
      hideHeader: true,
      cell: (u) => (
        <Row justify="end" nowrap>
          <ButtonLink to={`/users/${u.id}/edit`} size="small" aria-label={`Modifier ${u.displayName}`}>
            Modifier
          </ButtonLink>
          <Button variant="danger" size="small" aria-label={`Supprimer ${u.displayName}`} disabled={u.id === currentUserId} onClick={() => onDelete(u)}>
            Supprimer
          </Button>
        </Row>
      ),
    },
  ]
  return <DataTable caption="Utilisateurs" columns={columns} rows={users} rowKey={(u) => u.id} />
}
