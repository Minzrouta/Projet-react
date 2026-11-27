import { createContext, useContext, useState, type ReactNode } from 'react'
import { BrowserRouter, Navigate, NavLink, Route, Routes } from 'react-router'
import { mockApi, type UserDto } from './mocks/api'
import DashboardPage from './pages/DashboardPage'
import EditorPage from './pages/EditorPage'
import InvoicePage from './pages/InvoicePage'
import InvoicesPage from './pages/InvoicesPage'
import LoginPage from './pages/LoginPage'
import RemindersPage from './pages/RemindersPage'

// Utilisateur connecté : gardé en mémoire (état React), jamais dans localStorage.
interface AuthContextValue {
  user: UserDto | null
  login: (user: UserDto) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => undefined,
  logout: () => undefined,
})

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}

/** Utilisateur connecté, garanti non nul dans les pages protégées. */
export function useUser(): UserDto {
  const { user } = useAuth()
  if (!user) throw new Error('Page protégée rendue sans utilisateur connecté')
  return user
}

function RequireAuth({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (admin && user.role !== 'ADMIN') return <Navigate to="/" replace />
  return <>{children}</>
}

function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  if (!user) return <>{children}</>
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__brand">Facturation & relances</div>
        <nav className="app-header__nav">
          <NavLink to="/" end>Factures</NavLink>
          <NavLink to="/new">Nouvelle facture</NavLink>
          <NavLink to="/reminders">Relances</NavLink>
          <NavLink to="/dashboard">Tableau de bord</NavLink>
        </nav>
        <div className="app-header__user">
          <span className="app-header__name">{user.displayName}</span>
          {user.role === 'ADMIN' && <span className="badge badge--accent">admin</span>}
          <button className="btn btn--ghost btn--small" onClick={logout}>Déconnexion</button>
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState<UserDto | null>(null)
  const value: AuthContextValue = {
    user,
    login: setUser,
    logout: () => {
      mockApi.logout()
      setUser(null)
    },
  }
  return (
    <AuthContext.Provider value={value}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
            <Route path="/" element={<RequireAuth><InvoicesPage /></RequireAuth>} />
            <Route path="/new" element={<RequireAuth><EditorPage /></RequireAuth>} />
            <Route path="/invoices/:id/edit" element={<RequireAuth><EditorPage /></RequireAuth>} />
            <Route path="/invoices/:id" element={<RequireAuth><InvoicePage /></RequireAuth>} />
            <Route path="/reminders" element={<RequireAuth><RemindersPage /></RequireAuth>} />
            <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
            <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}
