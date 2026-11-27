import { expect, test, type Page } from '@playwright/test'
import { goTo, login } from './helpers'

/** Applique le filtre de statut et attend que la liste ne contienne plus que ce statut. */
async function filterByStatus(page: Page, label: string) {
  await page.getByLabel('Statut').selectOption({ label })
  await expect(page.getByRole('table', { name: 'Factures' }).getByRole('row').filter({ hasNotText: label })).toHaveCount(1) // l'en-tête seul
}

test.beforeEach(async ({ page }) => {
  await login(page, 'accountant')
})

test("cycle de vie d'une facture : brouillon, émission, paiement partiel, solde", async ({ page }) => {
  await goTo(page, 'Nouvelle facture')
  await page.getByLabel('Client').selectOption({ label: 'Globex SAS' })
  await page.getByLabel('Désignation 1').fill('Audit de performance')
  await page.getByLabel('Quantité 1').fill('2')
  await page.getByLabel('Prix unitaire 1').fill('500')
  // 2 x 500 = 1 000 HT, TVA 20 % : 1 200 TTC, calculé pendant la saisie.
  await expect(page.getByRole('row', { name: /Total TTC/ })).toContainText('1 200,00')
  await page.getByRole('button', { name: 'Enregistrer le brouillon' }).click()

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Brouillon')

  // L'émission est irréversible : elle passe par une confirmation.
  await page.getByRole('button', { name: 'Émettre', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Émettre cette facture ?' })
  await dialog.getByRole('button', { name: 'Émettre la facture' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/FAC-\d{4}-0010/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Émise')
  await expect(page.getByRole('link', { name: 'Modifier' })).toHaveCount(0)

  await page.getByLabel('Montant', { exact: true }).fill('200')
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Payée partiellement')
  await expect(page.getByRole('row', { name: /Reste dû/ })).toContainText('1 000,00')

  await page.getByRole('button', { name: 'Solde' }).click()
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Payée')
  await expect(page.getByRole('row', { name: /Reste dû/ })).toContainText('0,00')
  // Une facture soldée ne propose plus de paiement.
  await expect(page.getByLabel('Montant', { exact: true })).toHaveCount(0)
})

test('un paiement supérieur au reste dû est refusé', async ({ page }) => {
  await filterByStatus(page, 'En retard')
  await page.getByRole('table', { name: 'Factures' }).getByRole('link').first().click()

  await page.getByLabel('Montant', { exact: true }).fill('999999')
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Le paiement dépasse le reste dû')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('En retard')
})

test('un avoir du montant restant annule la dette', async ({ page }) => {
  await filterByStatus(page, 'Émise')
  await page.getByRole('table', { name: 'Factures' }).getByRole('link').first().click()
  const remaining = (await page.getByRole('row', { name: /Reste dû/ }).getByRole('cell').last().innerText()).replace(/[^\d,]/g, '').replace(',', '.')

  await page.getByLabel("Montant de l'avoir").fill(remaining)
  await page.getByLabel('Motif').fill('Prestation annulée')
  await page.getByRole('button', { name: "Créer l'avoir" }).click()

  await expect(page.getByText(/AVO-\d{4}-0003/)).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Annulée')
})

test("le filtre par statut passe par l'URL", async ({ page }) => {
  await page.getByLabel('Statut').selectOption({ label: 'En retard' })
  await expect(page).toHaveURL('/?status=OVERDUE')

  const rows = page.getByRole('table', { name: 'Factures' }).getByRole('row')
  await expect(rows).toHaveCount(4) // en-tête + 3 factures en retard
  for (const row of (await rows.all()).slice(1)) await expect(row).toContainText('En retard')
})

test('la recherche filtre la liste par client', async ({ page }) => {
  await page.getByLabel('Rechercher une facture').fill('hooli')
  const rows = page.getByRole('table', { name: 'Factures' }).getByRole('row')
  await expect(rows).toHaveCount(3)
  await page.getByLabel('Rechercher une facture').fill('introuvable')
  await expect(page.getByText('Aucune facture.')).toBeVisible()
})

test('une relance envoyée quitte la liste des relances à faire', async ({ page }) => {
  await goTo(page, 'Relances')
  const rows = page.getByRole('table', { name: 'Relances à envoyer' }).getByRole('row')
  await expect(rows).toHaveCount(4)

  await rows.nth(1).getByRole('button', { name: /Marquer envoyée/ }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Relance enregistrée' })).toBeVisible()
  await expect(rows).toHaveCount(3)
})

test('le tableau de bord et le relevé client reprennent les mêmes chiffres', async ({ page }) => {
  await goTo(page, 'Tableau de bord')
  await expect(page.getByRole('heading', { level: 1, name: 'Tableau de bord' })).toBeVisible()
  await expect(page.getByText('3 factures', { exact: true })).toBeVisible()

  await goTo(page, 'Clients')
  await page.getByRole('link', { name: 'ACME Industrie' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'ACME Industrie' })).toBeVisible()
  await expect(page.getByRole('table', { name: 'Factures de ACME Industrie' }).getByRole('row')).toHaveCount(4)
})
