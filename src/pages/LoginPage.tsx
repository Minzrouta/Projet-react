import { useState } from 'react'
import { Navigate, useLocation } from 'react-router'
import { Alert } from '../components/Alert'
import { AuthLayout } from '../components/AuthLayout'
import { useAuth } from '../features/auth/AuthContext'
import { DemoAccounts } from '../features/auth/DemoAccounts'
import { LoginForm, type Credentials } from '../features/auth/LoginForm'
import { useAction } from '../hooks/useAction'
import { APP_NAME, useDocumentTitle } from '../hooks/useDocumentTitle'
import { api } from '../lib/api'

const accounts = api.demoAccounts()

export default function LoginPage() {
  const { user, expired, login } = useAuth()
  const location = useLocation()
  const action = useAction()
  const [prefill, setPrefill] = useState<Credentials | undefined>()
  useDocumentTitle('Connexion')

  // Après connexion, retour à la page demandée au départ.
  const from = (location.state as { from?: string } | null)?.from ?? '/'
  if (user) return <Navigate to={from} replace />

  return (
    <AuthLayout title={APP_NAME} subtitle="Factures, paiements, avoirs">
      {expired && <Alert tone="warning">Votre session a expiré. Reconnectez-vous pour continuer.</Alert>}
      {/* Changer la key remonte le formulaire avec les identifiants du compte choisi. */}
      <LoginForm key={prefill?.email ?? 'empty'} initial={prefill} pending={action.pending} error={action.error?.message} onSubmit={({ email, password }) => void action.run(() => login(email, password))} />
      {accounts.length > 0 && <DemoAccounts accounts={accounts} onUse={({ email, password }) => setPrefill({ email, password })} />}
    </AuthLayout>
  )
}
