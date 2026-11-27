import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import './Toast.scss'

const ToastContext = createContext<(message: string) => void>(() => undefined)

/** Affiche une confirmation brève après une action réussie : `const toast = useToast(); toast('Paiement enregistré')`. */
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null)
  const show = useCallback((message: string) => setToast({ id: Date.now(), message }), [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(timer)
  }, [toast])

  return (
    <ToastContext.Provider value={show}>
      {children}
      {/* Zone toujours présente : son contenu est annoncé quand il change. */}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <p key={toast.id} className="toast">
            {toast.message}
          </p>
        )}
      </div>
    </ToastContext.Provider>
  )
}
