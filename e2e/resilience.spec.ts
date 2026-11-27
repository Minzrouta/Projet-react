import { expect, test } from '@playwright/test'
import { goTo, login } from './helpers'

test("une panne de l'API affiche une erreur, puis le réessai recharge la page", async ({ page }) => {
  await login(page, 'admin')

  // Toutes les requêtes de l'application répondent 503.
  await goTo(page, 'Simulation')
  await page.getByLabel('Pannes').selectOption({ label: 'Toujours le même code' })
  await page.getByLabel('Code HTTP renvoyé').selectOption('503')
  await page.getByRole('button', { name: 'Appliquer les pannes' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Pannes activées' })).toBeVisible()

  await goTo(page, 'Factures')
  await expect(page.getByRole('alert')).toContainText('Erreur simulée (HTTP 503)')
  // Le serveur demande d'attendre (Retry-After) : le bouton est bloqué pendant ce délai.
  await expect(page.getByRole('button', { name: /Réessayer dans \d s/ })).toBeDisabled()

  // La simulation n'est pas touchée par les pannes : on peut toujours la couper.
  await goTo(page, 'Simulation')
  await page.getByRole('button', { name: 'Tout remettre à zéro' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Simulation remise à zéro' })).toBeVisible()

  await goTo(page, 'Factures')
  await expect(page.getByRole('table', { name: 'Factures' })).toBeVisible()
})

test('une adresse inconnue affiche la page introuvable', async ({ page }) => {
  await login(page, 'accountant')
  await page.evaluate(() => window.history.pushState({}, '', '/nulle-part'))
  await page.goBack()
  await page.goForward()
  await expect(page.getByRole('heading', { level: 1, name: 'Page introuvable' })).toBeVisible()
  await page.getByRole('link', { name: 'Retour aux factures' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Factures' })).toBeVisible()
})
