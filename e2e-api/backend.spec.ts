import { expect, test, type Page } from '@playwright/test'

// Comptes créés par `npm run seed` ; l'administrateur est celui du .env du backend.
const ADMIN = { email: process.env.ADMIN_EMAIL ?? 'admin@example.com', password: process.env.ADMIN_PASSWORD ?? 'change-me' }
const ACCOUNTANT = { email: 'claire@example.com', password: 'claire123' }
const CLIENT = { email: 'acme@example.com', password: 'acme12345' }

async function login(page: Page, account: { email: string; password: string }) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(account.email)
  await page.getByLabel('Mot de passe').fill(account.password)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page.getByRole('heading', { level: 1, name: /factures/i })).toBeVisible()
}

const nav = (page: Page, link: string) => page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name: link, exact: true }).click()

test('la session survit au rechargement et au renouvellement du jeton', async ({ page }) => {
  await login(page, ACCOUNTANT)

  // Rechargement : le jeton d'accès (en mémoire) est perdu, la session reprend par le jeton de rafraîchissement.
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Factures' })).toBeVisible()
  await expect(page.getByText('Claire Comptable')).toBeVisible()

  // Une fois le jeton d'accès expiré, l'appel suivant reçoit un 401 : il est rejoué après renouvellement.
  const refreshed = page.waitForResponse((r) => r.url().endsWith('/api/auth/refresh') && r.ok())
  await page.waitForTimeout(Number(process.env.ACCESS_TTL_MS ?? 6000))
  await nav(page, 'Tableau de bord')
  await refreshed
  await expect(page.getByText('Restant dû')).toBeVisible()

  await page.getByRole('button', { name: 'Déconnexion' }).click()
  await page.reload()
  await expect(page).toHaveURL('/login')
})

test('une facture va du brouillon au solde', async ({ page }) => {
  await login(page, ACCOUNTANT)
  await nav(page, 'Nouvelle facture')
  await page.getByLabel('Client').selectOption({ label: 'Globex SAS' })
  await page.getByLabel('Désignation 1').fill(`Prestation E2E ${Date.now()}`)
  await page.getByLabel('Quantité 1').fill('2')
  await page.getByLabel('Prix unitaire 1').fill('500')
  await page.getByRole('button', { name: 'Enregistrer le brouillon' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Brouillon')

  await page.getByRole('button', { name: 'Émettre', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Émettre la facture' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/FAC-\d{4}-\d{4}/)

  // Refus métier de l'API (409 OVERPAYMENT) affiché tel quel.
  await page.getByLabel('Montant', { exact: true }).fill('5000')
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('dépasse le reste dû')

  await page.getByLabel('Montant', { exact: true }).fill('200')
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Payée partiellement')

  await page.getByLabel("Montant de l'avoir").fill('100')
  await page.getByLabel('Motif').fill('Geste commercial')
  await page.getByRole('button', { name: "Créer l'avoir" }).click()
  await expect(page.getByText(/AVO-\d{4}-\d{4}/)).toBeVisible()

  await page.getByRole('button', { name: 'Solde' }).click()
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Payée')
  await expect(page.getByRole('row', { name: /Reste dû/ })).toContainText('0,00')
})

test("l'émission d'une facture déjà échue est refusée, le brouillon reste enregistré", async ({ page }) => {
  await login(page, ACCOUNTANT)
  await nav(page, 'Nouvelle facture')
  await page.getByLabel('Client').selectOption({ label: 'Globex SAS' })
  await page.getByLabel('Échéance').fill('2020-01-01')
  await page.getByLabel('Désignation 1').fill(`Échue E2E ${Date.now()}`)
  await page.getByLabel('Prix unitaire 1').fill('10')
  await page.getByRole('button', { name: 'Enregistrer et émettre' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Émettre la facture' }).click()

  await expect(page.getByRole('status').filter({ hasText: 'émission refusée' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Brouillon')
})

test('un client ne voit que ses factures', async ({ page }) => {
  await login(page, CLIENT)
  await expect(page.getByRole('heading', { level: 1, name: 'Mes factures' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link')).toHaveCount(1)
  await expect(page.getByRole('table', { name: 'Mes factures' }).getByText('Brouillon')).toHaveCount(0)
})

test("gestion des utilisateurs : création, e-mail en double, modification, suppression", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`
  await login(page, ADMIN)
  await nav(page, 'Utilisateurs')

  await page.getByRole('link', { name: 'Nouvel utilisateur' }).click()
  await page.getByLabel('Nom affiché').fill('Zoé Test')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mot de passe initial').fill('motdepasse123')
  await page.getByLabel('Service comptable').check()
  await page.getByRole('button', { name: "Créer l'utilisateur" }).click()

  await page.getByLabel('Rechercher un utilisateur').fill(email)
  const row = page.getByRole('row', { name: /Zoé Test/ })
  await expect(row).toContainText('comptable')

  // Même e-mail une seconde fois : l'erreur de l'API est rattachée au champ.
  await page.getByRole('link', { name: 'Nouvel utilisateur' }).click()
  await page.getByLabel('Nom affiché').fill('Doublon')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mot de passe initial').fill('motdepasse123')
  await page.getByRole('button', { name: "Créer l'utilisateur" }).click()
  await expect(page.getByLabel('Email')).toHaveAccessibleDescription(/.+/)
  await page.getByRole('link', { name: 'Annuler' }).click()

  await page.getByLabel('Rechercher un utilisateur').fill(email)
  await page.getByRole('link', { name: 'Modifier Zoé Test' }).click()
  await expect(page.getByLabel('Service comptable')).toBeChecked()
  await page.getByLabel('Nom affiché').fill('Zoé Modifiée')
  await page.getByLabel('Service comptable').uncheck()
  await page.getByRole('button', { name: 'Enregistrer' }).click()

  await page.getByLabel('Rechercher un utilisateur').fill(email)
  const edited = page.getByRole('row', { name: /Zoé Modifiée/ })
  await expect(edited).toBeVisible()
  await expect(edited).not.toContainText('comptable')

  await page.getByRole('button', { name: 'Supprimer Zoé Modifiée' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Supprimer' }).click()
  await expect(page.getByText('Aucun utilisateur ne correspond.')).toBeVisible()
})

test.describe('simulation de pannes', () => {
  // Quoi qu'il arrive, l'API est remise dans son état normal pour les autres tests.
  test.afterEach(async ({ request }) => {
    const api = process.env.API_URL ?? 'http://localhost:8080'
    const { accessToken } = await (await request.post(`${api}/api/auth/login`, { data: ADMIN })).json()
    await request.delete(`${api}/api/simulation`, { headers: { Authorization: `Bearer ${accessToken}` } })
  })

  test('une panne 503 affiche une erreur avec délai, puis le réessai aboutit', async ({ page }) => {
    await login(page, ADMIN)
    await nav(page, 'Simulation')
    await page.getByLabel('Pannes').selectOption({ label: 'Toujours le même code' })
    await page.getByLabel('Code HTTP renvoyé').selectOption('503')
    await page.getByRole('button', { name: 'Appliquer les pannes' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Pannes activées' })).toBeVisible()

    await nav(page, 'Clients')
    await expect(page.getByRole('alert')).toContainText('Erreur simulée (HTTP 503)')
    await expect(page.getByRole('button', { name: /Réessayer dans \d s/ })).toBeDisabled()

    await nav(page, 'Simulation')
    await page.getByRole('button', { name: 'Tout remettre à zéro' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Simulation remise à zéro' })).toBeVisible()
    await nav(page, 'Clients')
    await expect(page.getByRole('table', { name: 'Encours par client' })).toBeVisible()
  })

  test("une latence d'une seconde montre l'indicateur de chargement", async ({ page }) => {
    await login(page, ADMIN)
    await nav(page, 'Simulation')
    await page.getByLabel('Latence ajoutée à chaque requête').selectOption({ label: 'Faible (1 s)' })
    await expect(page.getByRole('status').filter({ hasText: 'Latence réglée' })).toBeVisible()

    await nav(page, 'Relances')
    await expect(page.getByText('Chargement…')).toBeVisible()
    await expect(page.getByText('Chargement…')).toHaveCount(0)
  })
})
