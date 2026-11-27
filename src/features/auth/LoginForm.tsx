import { useState } from 'react'
import { Alert } from '../../components/Alert'
import { Button } from '../../components/Button'
import { TextField } from '../../components/Field'
import { Stack } from '../../components/Layout'

export interface Credentials {
  email: string
  password: string
}

interface LoginFormProps {
  /** Identifiants à placer dans le formulaire (compte de démonstration choisi). Changer la `key` pour les appliquer. */
  initial?: Credentials
  pending?: boolean
  error?: string | null
  onSubmit: (credentials: Credentials) => void
}

export function LoginForm({ initial = { email: '', password: '' }, pending = false, error, onSubmit }: LoginFormProps) {
  const [form, setForm] = useState(initial)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        {error && <Alert tone="error">{error}</Alert>}
        <TextField label="Email" type="email" autoComplete="username" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <TextField label="Mot de passe" type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <Button type="submit" variant="primary" loading={pending}>
          {pending ? 'Connexion…' : 'Se connecter'}
        </Button>
      </Stack>
    </form>
  )
}
