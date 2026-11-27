import { useOutletContext } from 'react-router'
import type { UserDto } from '../../lib/api'

/** Ce que les pages protégées reçoivent de la route parente : l'utilisateur et ses droits. */
export interface Session {
  user: UserDto
  accountant: boolean
  admin: boolean
}

export const useSession = () => useOutletContext<Session>()
