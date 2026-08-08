import type { Page } from '@playwright/test';

/**
 * Namespaces a fixture title.
 *
 * A guest workspace arrives seeded with the design's sample rows, several of
 * which repeat across status groups. A spec that named its fixture after one of
 * them would match the seeded copies too and trip Playwright's strict mode, so
 * fixtures are prefixed to stay unambiguous.
 */
export const fixture = (title: string): string => `E2E ${title}`;

/**
 * Starts a fresh guest session. Every call provisions a distinct workspace on
 * the server, so specs never contend over the same data.
 */
export async function loginAsGuest(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Continue as Guest' }).click();
  await page.waitForURL('**/tasks');
  await page.getByRole('button', { name: /^To Do/ }).waitFor();
}

export async function addTask(
  page: Page,
  title: string,
  priority?: string,
): Promise<void> {
  await page.getByRole('button', { name: 'Add Task', exact: true }).first().click();
  await page.getByLabel('Task', { exact: true }).fill(title);
  if (priority) await page.getByRole('button', { name: priority, exact: true }).click();
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  await page.getByRole('link', { name: title }).first().waitFor();
}

export async function switchView(page: Page, view: 'List' | 'Board'): Promise<void> {
  await page.getByRole('button', { name: 'Fields' }).click();
  await page.getByRole('button', { name: view, exact: true }).click();
  await page.keyboard.press('Escape');
}
