import { Button } from '../Button'
import './Pagination.scss'

interface PaginationProps {
  /** Page courante, à partir de 0 (comme l'API). */
  page: number
  totalPages: number
  onChange: (page: number) => void
}

/** Navigation entre les pages d'une liste. Ne s'affiche pas s'il n'y a qu'une page. */
export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null
  return (
    <nav className="pagination" aria-label="Pagination">
      <Button size="small" disabled={page <= 0} onClick={() => onChange(page - 1)}>
        Précédente
      </Button>
      <span aria-current="page">
        Page {page + 1} sur {totalPages}
      </span>
      <Button size="small" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>
        Suivante
      </Button>
    </nav>
  )
}
