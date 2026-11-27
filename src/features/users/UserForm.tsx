import { useState } from 'react'
import { Alert } from '../../components/Alert'
import { Button, ButtonLink } from '../../components/Button'
import { CheckboxField, SelectField, TextField } from '../../components/Field'
import { Row, Stack } from '../../components/Layout'
import type { ApiError, Role, UserDto } from '../../lib/api'

export interface UserFormValues {
  email: string
  displayName: string
  role: Role
  enabled: boolean
  /** Rôle ACCOUNTANT de l'application Facturation. */
  accountant: boolean
  /** Renseigné à la création uniquement. */
  password: string
}

interface UserFormProps {
  /** Utilisateur à modifier. Absent : formulaire de création, avec mot de passe. */
  user?: UserDto
  /** L'utilisateur modifié a-t-il déjà le rôle comptable ? */
  accountant?: boolean
  pending?: boolean
  error?: ApiError | null
  /** Page vers laquelle « Annuler » renvoie. */
  cancelTo: string
  onSubmit: (values: UserFormValues) => void
}

export function UserForm({ user, accountant = false, pending = false, error, cancelTo, onSubmit }: UserFormProps) {
  const [form, setForm] = useState<UserFormValues>({
    email: user?.email ?? '',
    displayName: user?.displayName ?? '',
    role: user?.role ?? 'USER',
    enabled: user?.enabled ?? true,
    accountant,
    password: '',
  })
  const fields = error?.fields ?? {}
  // L'e-mail déjà pris arrive en 409, sans `fields` : on le rattache quand même à son champ.
  const emailError = fields.email ?? (error?.code === 'EMAIL_ALREADY_USED' ? error.message : undefined)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        {error && !error.fields && !emailError && <Alert tone="error">{error.message}</Alert>}
        <TextField label="Nom affiché" required maxLength={100} value={form.displayName} error={fields.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
        <TextField label="Email" type="email" required maxLength={255} value={form.email} error={emailError} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        {!user && (
          <TextField
            label="Mot de passe initial"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={100}
            hint="8 à 100 caractères."
            value={form.password}
            error={fields.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        )}
        <SelectField label="Rôle" value={form.role} error={fields.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
          <option value="USER">Utilisateur</option>
          <option value="ADMIN">Administrateur</option>
        </SelectField>
        <CheckboxField
          label="Service comptable"
          hint="Peut créer, émettre et encaisser les factures. Un administrateur a ce droit d'office."
          checked={form.role === 'ADMIN' || form.accountant}
          disabled={form.role === 'ADMIN'}
          onChange={(e) => setForm({ ...form, accountant: e.target.checked })}
        />
        {user && <CheckboxField label="Compte actif" hint="Un compte désactivé ne peut plus se connecter." checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />}
        <Row>
          <Button type="submit" variant="primary" loading={pending}>
            {user ? 'Enregistrer' : "Créer l'utilisateur"}
          </Button>
          <ButtonLink to={cancelTo}>Annuler</ButtonLink>
        </Row>
      </Stack>
    </form>
  )
}
