import { expect, test } from '@playwright/test'
import { goTo, login } from './helpers'

test.beforeEach(async ({ page }) => {
  await login(page, 'admin')
  await goTo(page, 'Utilisateurs')
})

test('créer, modifier puis supprimer un utilisateur', async ({ page }) => {
  // Création
  await page.getByRole('link', { name: 'Nouvel utilisateur' }).click()
  await page.getByLabel('Nom affiché').fill('Dana Leroy')
  await page.getByLabel('Email').fill('dana@example.com')
  await page.getByLabel('Mot de passe initial').fill('motdepasse123')
  await page.getByLabel('Service comptable').check()
  await page.getByRole('button', { name: "Créer l'utilisateur" }).click()

  const row = page.getByRole('row', { name: /Dana Leroy/ })
  await expect(row).toContainText('dana@example.com')
  await expect(row).toContainText('comptable')

  // Modification
  await page.getByRole('link', { name: 'Modifier Dana Leroy' }).click()
  await expect(page.getByLabel('Service comptable')).toBeChecked()
  await page.getByLabel('Nom affiché').fill('Dana Leroy-Martin')
  await page.getByLabel('Compte actif').uncheck()
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(page.getByRole('row', { name: /Dana Leroy-Martin/ })).toContainText('désactivé')

  // Suppression, après confirmation
  await page.getByRole('button', { name: 'Supprimer Dana Leroy-Martin' }).click()
  await page.getByRole('dialog', { name: 'Supprimer cet utilisateur ?' }).getByRole('button', { name: 'Supprimer' }).click()
  await expect(page.getByRole('row', { name: /Dana Leroy-Martin/ })).toHaveCount(0)
})

test('un e-mail déjà pris est signalé sur le champ', async ({ page }) => {
  await page.getByRole('link', { name: 'Nouvel utilisateur' }).click()
  await page.getByLabel('Nom affiché').fill('Autre Claire')
  await page.getByLabel('Email').fill('claire@example.com')
  await page.getByLabel('Mot de passe initial').fill('motdepasse123')
  await page.getByRole('button', { name: "Créer l'utilisateur" }).click()

  await expect(page.getByLabel('Email')).toHaveAccessibleDescription('Cette adresse e-mail est déjà utilisée')
  await expect(page).toHaveURL('/users/new')
})

test('le dernier administrateur ne peut être ni rétrogradé ni supprimé', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Supprimer Admin Démo' })).toBeDisabled()

  await page.getByRole('link', { name: 'Modifier Admin Démo' }).click()
  await page.getByLabel('Rôle').selectOption({ label: 'Utilisateur' })
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(page.getByRole('alert')).toContainText('au moins un administrateur actif')
})

test('la recherche interroge la liste des utilisateurs', async ({ page }) => {
  await page.getByLabel('Rechercher un utilisateur').fill('globex')
  await expect(page.getByRole('table', { name: 'Utilisateurs' }).getByRole('row')).toHaveCount(2)
  await expect(page.getByText('1 utilisateur', { exact: true })).toBeVisible()
})
