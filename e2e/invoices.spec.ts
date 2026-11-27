import { expect, test, type Page } from '@playwright/test'
import { goTo, login } from './helpers'

/** Applique le filtre de statut et attend que la liste ne contienne plus que ce statut. */
async function filterByStatus(page: Page, label: string) {
  await page.getByLabel('Statut').selectOption({ label })
  await expect(page.getByRole('table').getByRole('row').filter({ hasNotText: label })).toHaveCount(1) // l'en-tête seul
}

test.beforeEach(async ({ page }) => {
  await login(page, 'accountant')
})

test("cycle de vie d'une facture : brouillon, émission, paiement partiel, solde", async ({ page }) => {
  await goTo(page, 'Nouvelle facture')
  await page.getByLabel('Client').selectOption({ label: 'Globex SAS' })
  await page.getByLabel('Désignation 1').fill('Audit de performance')
  await page.getByLabel('Quantité').fill('2')
  await page.getByLabel('Prix unitaire').fill('500')
  // 2 x 500 = 1 000 HT, TVA 20 % : 1 200 TTC, calculé pendant la saisie.
  await expect(page.getByRole('row', { name: /Total TTC/ })).toContainText('1 200,00')
  await page.getByRole('button', { name: 'Enregistrer le brouillon' }).click()

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Brouillon')

  await page.getByRole('button', { name: 'Émettre', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/FAC-\d{4}-0004/)
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
  await page.getByRole('table').getByRole('link').first().click()

  await page.getByLabel('Montant', { exact: true }).fill('999999')
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click()
  await expect(page.getByText('Le paiement dépasse le reste dû')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('En retard')
})

test('un avoir du montant restant annule la facture', async ({ page }) => {
  await filterByStatus(page, 'Émise')
  await page.getByRole('table').getByRole('link').first().click()
  const remaining = (await page.getByRole('row', { name: /Reste dû/ }).getByRole('cell').last().innerText()).replace(/[^\d,]/g, '').replace(',', '.')

  await page.getByLabel("Montant de l'avoir").fill(remaining)
  await page.getByLabel('Motif').fill('Prestation annulée')
  await page.getByRole('button', { name: "Créer l'avoir" }).click()

  await expect(page.getByText(/AVO-\d{4}-0001/)).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Annulée')
})

test('le filtre par statut ne garde que les factures en retard', async ({ page }) => {
  await page.getByLabel('Statut').selectOption({ label: 'En retard' })
  const rows = page.getByRole('table').getByRole('row')
  await expect(rows).toHaveCount(2) // en-tête + 1 facture en retard
  await expect(rows.nth(1)).toContainText('En retard')
})

test('une relance envoyée quitte la liste des relances à faire', async ({ page }) => {
  await goTo(page, 'Relances')
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(2)

  await page.getByRole('button', { name: 'Marquer envoyée' }).click()
  await expect(page.getByText('Aucune relance à envoyer.')).toBeVisible()
})

test('le tableau de bord affiche les montants en retard', async ({ page }) => {
  await goTo(page, 'Tableau de bord')
  await expect(page.getByRole('heading', { level: 1, name: 'Tableau de bord' })).toBeVisible()
  await expect(page.getByText('1 facture(s)')).toBeVisible()
})
