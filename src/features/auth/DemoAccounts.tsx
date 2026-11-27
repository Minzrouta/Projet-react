import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { DataTable, type Column } from '../../components/Table'
import { Text } from '../../components/Text'
import type { DemoAccount } from '../../lib/api'
import './DemoAccounts.scss'

interface DemoAccountsProps {
  accounts: DemoAccount[]
  onUse: (account: DemoAccount) => void
}

/** Rappel des comptes de démonstration du mode bouchonné, sous le formulaire de connexion. */
export function DemoAccounts({ accounts, onUse }: DemoAccountsProps) {
  const columns: Column<DemoAccount>[] = [
    {
      key: 'name',
      header: 'Nom',
      cell: (a) => (
        <>
          {a.displayName}
          {a.role === 'ADMIN' && <Badge tone="accent">admin</Badge>}
          {a.note && (
            <Text tone="muted" size="small" as="p">
              {a.note}
            </Text>
          )}
        </>
      ),
    },
    { key: 'email', header: 'Email', cell: (a) => a.email },
    { key: 'password', header: 'Mot de passe', cell: (a) => <code>{a.password}</code> },
    {
      key: 'use',
      header: 'Action',
      hideHeader: true,
      cell: (a) => (
        <Button variant="ghost" size="small" aria-label={`Utiliser le compte ${a.displayName}`} onClick={() => onUse(a)}>
          Utiliser
        </Button>
      ),
    },
  ]
  return (
    <section className="demo-accounts">
      <h2>Comptes de démonstration</h2>
      <DataTable caption="Comptes de démonstration" compact columns={columns} rows={accounts} rowKey={(a) => a.email} />
      <Text tone="muted" size="small" as="p">
        Données en mémoire : elles sont réinitialisées à chaque rechargement de la page.
      </Text>
    </section>
  )
}
