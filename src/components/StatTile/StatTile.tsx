import '../Card/Card.scss'
import './StatTile.scss'

interface StatTileProps {
  label: string
  value: string
  hint?: string
}

/** Chiffre clé du tableau de bord. */
export function StatTile({ label, value, hint }: StatTileProps) {
  return (
    <div className="card stat">
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}</span>
      {hint && <span className="stat__hint">{hint}</span>}
    </div>
  )
}
