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
  await expect(page.getByRole('alert')).toHaveText('Email ou mot de passe incorrect')
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
  await page.getByRole('button', { name: 'Utiliser le compte ACME Industrie' }).click()
  await expect(page.getByLabel('Email')).toHaveValue('acme@example.com')
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Mes factures' })).toBeVisible()
})

test('un client ne voit que ses factures émises et aucune page comptable', async ({ page }) => {
  await login(page, 'client')
  const table = page.getByRole('table', { name: 'Mes factures' })
  await expect(table.getByRole('row')).toHaveCount(4) // en-tête + 3 factures ACME
  await expect(table.getByText('Brouillon')).toHaveCount(0)
  await expect(table.getByRole('columnheader', { name: 'Client' })).toHaveCount(0)

  const nav = page.getByRole('navigation', { name: 'Navigation principale' })
  await expect(nav.getByRole('link')).toHaveCount(1)

  // La facture ouverte ne propose ni paiement ni relance.
  await table.getByRole('link').first().click()
  await expect(page.getByRole('heading', { level: 2, name: 'Paiements' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Enregistrer' })).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 2, name: 'Relances' })).toHaveCount(0)
})
