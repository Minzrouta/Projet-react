import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../App'
import { mockApi, type ApiError } from '../mocks/api'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const accounts = mockApi.demoAccounts()

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await mockApi.login(email, password)
      login(res.user)
      navigate('/', { replace: true })
    } catch (e) {
      setError((e as ApiError).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <div className="login__card card">
        <h1 className="login__title">Facturation & relances</h1>
        <p className="muted">Factures, paiements, avoirs</p>

        {error && <div className="alert alert--error">{error}</div>}

        <form className="stack" onSubmit={onSubmit}>
          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </label>
          <label className="field">
            <span>Mot de passe</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button className="btn btn--primary" type="submit" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div className="login__demo">
          <h2>Comptes de démonstration</h2>
          <table className="table table--compact">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Mot de passe</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.email}>
                  <td>
                    {a.displayName}
                    {a.role === 'ADMIN' && <span className="badge badge--accent">admin</span>}
                    {a.note && <div className="muted small">{a.note}</div>}
                  </td>
                  <td>{a.email}</td>
                  <td>
                    <code>{a.password}</code>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--ghost btn--small"
                      onClick={() => {
                        setEmail(a.email)
                        setPassword(a.password)
                      }}
                    >
                      Utiliser
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted small">Données en mémoire : elles sont réinitialisées à chaque rechargement de la page.</p>
        </div>
      </div>
    </div>
  )
}
