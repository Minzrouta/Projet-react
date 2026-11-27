import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { mockApi, type ApiError, type InvoiceRequest, type LineRequest, type UserSummary } from '../mocks/api'
import { euro, useAccountant } from './InvoicesPage'

const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)
const EMPTY_LINE: LineRequest = { label: '', quantity: 1, unitPrice: 0, vatRate: 20 }

export default function EditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const accountant = useAccountant()
  const [clients, setClients] = useState<UserSummary[]>([])
  const [form, setForm] = useState<InvoiceRequest>({ clientId: '', lines: [EMPTY_LINE], dueDate: inDays(30) })
  const [error, setError] = useState<ApiError | null>(null)

  useEffect(() => {
    mockApi.clients().then(setClients).catch(() => setClients([]))
    if (id) mockApi.get(id).then((i) => setForm({ clientId: i.clientId, dueDate: i.dueDate, lines: i.lines.map(({ label, quantity, unitPrice, vatRate }) => ({ label, quantity, unitPrice, vatRate })) })).catch((e: ApiError) => setError(e))
  }, [id])

  const setLine = (i: number, patch: Partial<LineRequest>) => setForm({ ...form, lines: form.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) })
  // aperçu des totaux, mêmes règles d'arrondi que l'API (au centime par ligne)
  const totals = form.lines.reduce((s, l) => {
    const ht = Math.round(l.quantity * l.unitPrice * 100) / 100
    const vat = Math.round(ht * l.vatRate) / 100
    return { ht: s.ht + ht, vat: s.vat + vat }
  }, { ht: 0, vat: 0 })

  async function save(andIssue: boolean) {
    setError(null)
    try {
      let inv = id ? await mockApi.update(id, form) : await mockApi.create(form)
      if (andIssue) inv = await mockApi.issue(inv.id)
      navigate(`/invoices/${inv.id}`)
    } catch (e) {
      setError(e as ApiError)
    }
  }

  if (accountant === false) return <div className="alert alert--warning">Réservé au service comptable.</div>

  return (
    <div className="stack">
      <h1>{id ? 'Modifier le brouillon' : 'Nouvelle facture'}</h1>
      {error && <div className="alert alert--error">{error.message}{error.fields && <ul>{Object.entries(error.fields).map(([k, v]) => <li key={k}>{k} : {v}</li>)}</ul>}</div>}
      <div className="form-grid">
        <label className="field">
          <span>Client</span>
          <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} required>
            <option value="">— choisir —</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
          </select>
        </label>
        <label className="field"><span>Échéance</span><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></label>
      </div>
      <table className="table">
        <thead><tr><th>Désignation</th><th className="num">Qté</th><th className="num">PU HT (€)</th><th className="num">TVA %</th><th className="num">Total HT</th><th /></tr></thead>
        <tbody>
          {form.lines.map((l, i) => (
            <tr key={i}>
              <td><input value={l.label} onChange={(e) => setLine(i, { label: e.target.value })} aria-label={`Désignation ${i + 1}`} /></td>
              <td><input className="num-input" type="number" step="0.01" min={0.01} value={l.quantity} onChange={(e) => setLine(i, { quantity: Number(e.target.value) })} aria-label="Quantité" /></td>
              <td><input className="num-input" type="number" step="0.01" min={0} value={l.unitPrice} onChange={(e) => setLine(i, { unitPrice: Number(e.target.value) })} aria-label="Prix unitaire" /></td>
              <td>
                <select value={l.vatRate} onChange={(e) => setLine(i, { vatRate: Number(e.target.value) })} aria-label="TVA">
                  {[20, 10, 5.5, 2.1, 0].map((r) => <option key={r} value={r}>{r} %</option>)}
                </select>
              </td>
              <td className="num">{euro(Math.round(l.quantity * l.unitPrice * 100) / 100)}</td>
              <td><button className="btn btn--ghost btn--small" aria-label="Retirer la ligne" onClick={() => setForm({ ...form, lines: form.lines.filter((_, j) => j !== i) })}>✕</button></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td colSpan={4}>Total HT</td><td className="num">{euro(totals.ht)}</td><td /></tr>
          <tr><td colSpan={4}>TVA</td><td className="num">{euro(totals.vat)}</td><td /></tr>
          <tr><td colSpan={4} className="strong">Total TTC</td><td className="num strong">{euro(totals.ht + totals.vat)}</td><td /></tr>
        </tfoot>
      </table>
      <button className="btn btn--small" onClick={() => setForm({ ...form, lines: [...form.lines, EMPTY_LINE] })}>+ Ligne</button>
      <div className="row">
        <button className="btn" onClick={() => save(false)}>Enregistrer le brouillon</button>
        <button className="btn btn--primary" onClick={() => save(true)}>Enregistrer et émettre</button>
      </div>
      <p className="small muted">Une fois émise, la facture reçoit son numéro définitif et ne peut plus être modifiée : toute correction passe par un avoir.</p>
    </div>
  )
}
