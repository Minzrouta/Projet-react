import { ButtonLink } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'

export default function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page introuvable" />
      <EmptyState
        action={
          <ButtonLink to="/" variant="primary">
            Retour aux factures
          </ButtonLink>
        }
      >
        Cette adresse ne correspond à aucune page de l'application.
      </EmptyState>
    </>
  )
}
