import { expect, test } from '@playwright/test';
import { loginAsGuest } from './helpers';

const htmlState = async (page: import('@playwright/test').Page) =>
  page.evaluate(() => ({
    dark: document.documentElement.classList.contains('dark'),
    accent: document.documentElement.dataset.accent,
  }));

test.describe('Theme', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsGuest(page);
  });

  test('switches to dark from the user menu and survives a reload', async ({ page }) => {
    await expect.poll(async () => (await htmlState(page)).dark).toBe(false);

    await page.locator('aside button').first().click();
    await page.getByText('Change Theme').click();
    await page.getByRole('menuitem', { name: 'Dark' }).click();

    await expect.poll(async () => (await htmlState(page)).dark).toBe(true);

    await page.reload();
    // The inline boot script must apply this before first paint.
    await expect.poll(async () => (await htmlState(page)).dark).toBe(true);
  });

  test('offers exactly Light and Dark — the design has no System option', async ({ page }) => {
    await page.goto('/settings/theme');

    await expect(page.getByRole('button', { name: /Light/ })).toHaveCount(1);
    await expect(page.getByRole('button', { name: /Dark/ })).toHaveCount(1);
    await expect(page.getByText('System', { exact: true })).toHaveCount(0);
  });

  test('offers all six colour modes and persists the choice', async ({ page }) => {
    await page.goto('/settings/color');

    for (const colour of ['Amber', 'Blue', 'Pink', 'Rose', 'Emerald', 'Black']) {
      await expect(page.getByRole('button', { name: colour })).toHaveCount(1);
    }

    await page.getByRole('button', { name: 'Emerald' }).click();
    await expect.poll(async () => (await htmlState(page)).accent).toBe('emerald');

    await page.reload();
    await expect.poll(async () => (await htmlState(page)).accent).toBe('emerald');
  });

  test('theme and accent persist independently', async ({ page }) => {
    await page.goto('/settings/color');
    await page.getByRole('button', { name: 'Rose' }).click();
    await page.goto('/settings/theme');
    await page.getByRole('button', { name: /Dark/ }).click();

    await page.reload();
    await expect.poll(async () => await htmlState(page)).toEqual({ dark: true, accent: 'rose' });
  });
});

test.describe('Settings › Profile', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsGuest(page);
    await page.goto('/settings/profile');
  });

  test('rejects a multi-word username with the API message', async ({ page }) => {
    await page.getByPlaceholder('Dexuser').fill('two words');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByText(/Username must be one word/)).toBeVisible();
  });

  test('saves and persists the profile', async ({ page }) => {
    await page.getByPlaceholder('Dexter').fill('Dexter');
    await page.getByPlaceholder('Designer').fill('Designer');
    await page.getByPlaceholder('Dexuser').fill('Dexuser');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Profile updated.')).toBeVisible();

    await page.reload();
    await expect(page.getByPlaceholder('Dexter')).toHaveValue('Dexter');
    await expect(page.getByPlaceholder('Designer')).toHaveValue('Designer');
  });
});
