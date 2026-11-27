import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'
import './Table.scss'

interface TableProps {
  /** Décrit le tableau aux lecteurs d'écran et nomme la zone défilante. */
  caption: string
  compact?: boolean
  children: ReactNode
}

/** Tableau brut : on écrit soi-même <thead>, <tbody>, <tfoot>. Sur petit écran il défile horizontalement. */
export function Table({ caption, compact = false, children }: TableProps) {
  return (
    // Une zone défilante doit pouvoir recevoir le focus, sinon elle est inaccessible au clavier.
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <div className="table-wrap" role="region" aria-label={caption} tabIndex={0}>
      <table className={cx('table', compact && 'table--compact')}>
        <caption className="visually-hidden">{caption}</caption>
        {children}
      </table>
    </div>
  )
}

interface CellProps {
  /** Aligne à droite avec des chiffres à chasse fixe : montants, quantités. */
  numeric?: boolean
  strong?: boolean
  colSpan?: number
  children?: ReactNode
}

export function Td({ numeric, strong, colSpan, children }: CellProps) {
  return (
    <td className={cx(numeric && 'num', strong && 'strong') || undefined} colSpan={colSpan}>
      {children}
    </td>
  )
}

export function Th({ numeric, children }: Pick<CellProps, 'numeric' | 'children'>) {
  return (
    <th scope="col" className={numeric ? 'num' : undefined}>
      {children}
    </th>
  )
}

export interface Column<Row> {
  /** Identifiant de la colonne (clé React). */
  key: string
  /** En-tête. `hideHeader` le réserve aux lecteurs d'écran (colonne d'actions). */
  header: string
  hideHeader?: boolean
  numeric?: boolean
  strong?: boolean
  cell: (row: Row) => ReactNode
}

export interface FooterRow {
  label: string
  value: ReactNode
  strong?: boolean
}

interface DataTableProps<Row> {
  caption: string
  columns: Column<Row>[]
  rows: Row[]
  /** Clé stable de chaque ligne : l'identifiant de la donnée, jamais l'index. */
  rowKey: (row: Row) => string | number
  /** Lignes de total : le libellé occupe toutes les colonnes sauf la dernière. */
  footer?: FooterRow[]
  compact?: boolean
}

/** Tableau décrit par ses colonnes : c'est la forme à utiliser pour afficher une liste de données. */
export function DataTable<Row>({ caption, columns, rows, rowKey, footer, compact }: DataTableProps<Row>) {
  return (
    <Table caption={caption} compact={compact}>
      <thead>
        <tr>
          {columns.map((column) => (
            <Th key={column.key} numeric={column.numeric}>
              {column.hideHeader ? <span className="visually-hidden">{column.header}</span> : column.header}
            </Th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={rowKey(row)}>
            {columns.map((column) => (
              <Td key={column.key} numeric={column.numeric} strong={column.strong}>
                {column.cell(row)}
              </Td>
            ))}
          </tr>
        ))}
      </tbody>
      {footer && (
        <tfoot>
          {footer.map((line) => (
            <tr key={line.label}>
              <Td colSpan={columns.length - 1} strong={line.strong}>
                {line.label}
              </Td>
              <Td numeric strong={line.strong}>
                {line.value}
              </Td>
            </tr>
          ))}
        </tfoot>
      )}
    </Table>
  )
}
