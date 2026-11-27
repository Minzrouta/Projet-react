import { expect, test } from '@playwright/test'
import { login } from './helpers'

test('une page protégée renvoie vers la connexion', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL('/login')
  await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible()
})

test('un mauvais mot de passe est refusé avec un message', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('claire@example.com')
  await page.getByLabel('Mot de passe').fill('mauvais')
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page.getByText('Email ou mot de passe incorrect')).toBeVisible()
  await expect(page).toHaveURL('/login')
})

test('la comptable se connecte, puis se déconnecte', async ({ page }) => {
  await login(page, 'accountant')
  await expect(page.getByRole('heading', { level: 1, name: 'Factures' })).toBeVisible()
  await expect(page.getByText('Claire Comptable')).toBeVisible()

  await page.getByRole('button', { name: 'Déconnexion' }).click()
  await expect(page).toHaveURL('/login')
})

test('un compte de démonstration remplit le formulaire', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('row', { name: /ACME Industrie/ }).getByRole('button', { name: 'Utiliser' }).click()
  await expect(page.getByLabel('Email')).toHaveValue('acme@example.com')
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Mes factures' })).toBeVisible()
})

test('un client ne voit que ses factures émises', async ({ page }) => {
  await login(page, 'client')
  const rows = page.getByRole('table').getByRole('row')
  await expect(rows).toHaveCount(3) // en-tête + 2 factures ACME
  await expect(page.getByRole('table').getByText('Brouillon')).toHaveCount(0)
  await expect(page.getByRole('columnheader', { name: 'Client' })).toHaveCount(0)

  // La facture ouverte ne propose ni paiement ni relance.
  await rows.nth(1).getByRole('link').click()
  await expect(page.getByRole('heading', { level: 2, name: 'Paiements' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Enregistrer' })).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 2, name: 'Relances' })).toHaveCount(0)
})
