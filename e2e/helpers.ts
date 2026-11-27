import { expect, type Page } from '@playwright/test'

// Comptes de démonstration du mode bouchonné (src/mocks/data.ts).
export const ACCOUNTS = {
  admin: { email: 'admin@example.com', password: 'admin123' },
  accountant: { email: 'claire@example.com', password: 'claire123' },
  client: { email: 'acme@example.com', password: 'acme123' },
}

export async function login(page: Page, who: keyof typeof ACCOUNTS) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(ACCOUNTS[who].email)
  await page.getByLabel('Mot de passe').fill(ACCOUNTS[who].password)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page.getByRole('heading', { level: 1, name: /factures/i })).toBeVisible()
}

/** Les données sont en mémoire : on navigue par les liens, un rechargement remettrait tout à zéro. */
export async function goTo(page: Page, link: string) {
  await page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name: link, exact: true }).click()
}
