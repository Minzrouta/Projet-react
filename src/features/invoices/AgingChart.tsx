import { euro } from '../../lib/format'
import './AgingChart.scss'

interface AgingChartProps {
  buckets: { label: string; amount: number }[]
}

/**
 * Montants en retard par ancienneté. Une seule série : chaque barre porte sa valeur, pas de légende.
 * Le balisage est un tableau, lisible tel quel par un lecteur d'écran.
 */
export function AgingChart({ buckets }: AgingChartProps) {
  const max = Math.max(...buckets.map((b) => b.amount), 1)
  return (
    <table className="aging-chart">
      <caption className="visually-hidden">Montants en retard par ancienneté du retard</caption>
      <thead className="visually-hidden">
        <tr>
          <th scope="col">Ancienneté</th>
          <th scope="col">Montant</th>
        </tr>
      </thead>
      <tbody>
        {buckets.map((bucket) => (
          <tr key={bucket.label}>
            <th scope="row">{bucket.label}</th>
            <td>
              <progress className="aging-chart__bar" value={bucket.amount} max={max} aria-hidden="true" />
              <span className="aging-chart__value">{euro(bucket.amount)}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
