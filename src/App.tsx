import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router'
import { Alert } from './components/Alert'
import { AppLayout, type NavItem } from './components/AppLayout'
import { ErrorState } from './components/ErrorState'
import { Loader } from './components/Loader'
import { ToastProvider } from './components/Toast'
import { AuthProvider, useAuth } from './features/auth/AuthContext'
import { useSession, type Session } from './features/auth/session'
import { APP_NAME } from './hooks/useDocumentTitle'
import { useQuery } from './hooks/useQuery'
import { api } from './lib/api'
import LoginPage from './pages/LoginPage'

// Une page = un fichier JavaScript chargé à la demande (code splitting par route).
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'))
const InvoicePage = lazy(() => import('./pages/InvoicePage'))
const EditorPage = lazy(() => import('./pages/EditorPage'))
const RemindersPage = lazy(() => import('./pages/RemindersPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

/** Chacun ne voit que les entrées qui le concernent. */
function navFor({ accountant }: Session): NavItem[] {
  if (!accountant) return [{ to: '/', label: 'Mes factures' }]
  return [
    { to: '/', label: 'Factures' },
    { to: '/new', label: 'Nouvelle facture' },
    { to: '/reminders', label: 'Relances' },
    { to: '/dashboard', label: 'Tableau de bord' },
  ]
}

/** Route parente des pages connectées : vérifie la session, charge les droits, pose le cadre. */
function ProtectedLayout() {
  const { user, ready, logout } = useAuth()
  const location = useLocation()
  const roles = useQuery<string[]>(`roles:${user?.id ?? ''}`, async () => (user ? api.myRoles() : []))

  if (!ready) return <Loader />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />

  const session: Session | null = roles.data ? { user, accountant: roles.data.includes('ACCOUNTANT'), admin: user.role === 'ADMIN' } : null
  return (
    <AppLayout brand={APP_NAME} nav={session ? navFor(session) : []} userName={user.displayName} admin={user.role === 'ADMIN'} onLogout={logout}>
      {roles.error && <ErrorState error={roles.error} onRetry={roles.reload} />}
      {!session && !roles.error && <Loader />}
      {session && (
        <Suspense fallback={<Loader />}>
          <Outlet context={session} />
        </Suspense>
      )}
    </AppLayout>
  )
}

/** Garde des pages du service comptable. */
function AccountantOnly() {
  const session = useSession()
  if (!session.accountant) return <Alert tone="warning">Réservé au service comptable.</Alert>
  return <Outlet context={session} />
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route element={<ProtectedLayout />}>
            <Route index element={<InvoicesPage />} />
            <Route path="invoices/:id" element={<InvoicePage />} />
            <Route element={<AccountantOnly />}>
              <Route path="new" element={<EditorPage />} />
              <Route path="invoices/:id/edit" element={<EditorPage />} />
              <Route path="reminders" element={<RemindersPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}
