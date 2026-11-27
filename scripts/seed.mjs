// Charge un jeu de démonstration dans le backend par son API publique (rien n'est écrit en base à la main).
// Usage : npm run seed            (API sur http://localhost:8080, admin de backend/.env.example)
//         API_URL=… ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run seed
// Relançable : un utilisateur déjà créé est réutilisé, les factures ne sont créées qu'une fois.

const API = process.env.API_URL ?? 'http://localhost:8080'
const ADMIN = { email: process.env.ADMIN_EMAIL ?? 'admin@example.com', password: process.env.ADMIN_PASSWORD ?? 'change-me' }

const USERS = [
  { email: 'claire@example.com', password: 'claire123', displayName: 'Claire Comptable', role: 'USER', accountant: true },
  { email: 'acme@example.com', password: 'acme12345', displayName: 'ACME Industrie', role: 'USER' },
  { email: 'globex@example.com', password: 'globex123', displayName: 'Globex SAS', role: 'USER' },
]

let token = ''

async function call(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const json = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw Object.assign(new Error(`${method} ${path} : ${res.status} ${json?.message ?? ''}`), { status: res.status })
  return json
}

const inDays = (n) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)

async function ensureUser({ accountant, ...user }) {
  let created
  try {
    created = await call('POST', '/api/users', user)
  } catch (e) {
    if (e.status !== 409) throw e
    const page = await call('GET', `/api/users?search=${encodeURIComponent(user.email)}`)
    created = page.content.find((u) => u.email === user.email)
  }
  if (accountant) await call('PUT', `/api/invoices/admin/roles/${created.id}`, { role: 'ACCOUNTANT' })
  return created
}

token = (await call('POST', '/api/auth/login', ADMIN)).accessToken
const [, acme, globex] = await Promise.all(USERS.map(ensureUser))
console.log('Utilisateurs prêts :', USERS.map((u) => `${u.email} / ${u.password}`).join(', '))

if ((await call('GET', '/api/invoices')).length > 0) {
  console.log('Des factures existent déjà : rien à ajouter.')
  process.exit(0)
}

const invoice = (clientId, dueIn, lines) => call('POST', '/api/invoices', { clientId, dueDate: inDays(dueIn), lines })
const issue = async (draft) => call('POST', `/api/invoices/${(await draft).id}/issue`)

// Une facture soldée, une payée en partie, une annulée par un avoir, une émise, un brouillon.
// L'API refuse d'émettre une facture déjà échue : aucun retard ne peut être créé le jour même.
const paid = await issue(invoice(acme.id, 30, [{ label: 'Licence annuelle', quantity: 1, unitPrice: 1200, vatRate: 20 }]))
await call('POST', `/api/invoices/${paid.id}/payments`, { date: inDays(0), amount: paid.totalTtc, method: 'CARD' })

const partial = await issue(invoice(acme.id, 15, [{ label: 'Audit de sécurité', quantity: 3, unitPrice: 900, vatRate: 20 }]))
await call('POST', `/api/invoices/${partial.id}/payments`, { date: inDays(0), amount: 1000, method: 'TRANSFER' })

const cancelled = await issue(invoice(globex.id, 20, [{ label: 'Hébergement, 4e trimestre', quantity: 3, unitPrice: 99, vatRate: 20 }]))
await call('POST', `/api/invoices/${cancelled.id}/credit-notes`, { amount: cancelled.totalTtc, reason: 'Facture émise en double' })

await issue(
  invoice(globex.id, 30, [
    { label: 'Formation React, 2 jours', quantity: 2, unitPrice: 650, vatRate: 20 },
    { label: 'Support de cours', quantity: 10, unitPrice: 25, vatRate: 5.5 },
  ]),
)
await invoice(globex.id, 45, [{ label: 'Maintenance, décembre', quantity: 1, unitPrice: 450, vatRate: 20 }])

console.log('5 factures créées.')
