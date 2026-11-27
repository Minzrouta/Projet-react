const EURO = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

export const euro = (amount: number) => EURO.format(amount)

/** Date ISO (avec ou sans heure) affichée au format français, sans décalage de fuseau. */
export const day = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('fr-FR')

/** Date locale du jour au format ISO (AAAA-MM-JJ), décalée de `offset` jours. */
export function isoDate(offset = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count > 1 ? many : one}`
