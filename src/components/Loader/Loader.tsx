import './Loader.scss'

interface LoaderProps {
  label?: string
}

/** Indicateur de chargement, annoncé aux lecteurs d'écran. */
export function Loader({ label = 'Chargement…' }: LoaderProps) {
  return (
    <div className="loading" role="status">
      {label}
    </div>
  )
}
