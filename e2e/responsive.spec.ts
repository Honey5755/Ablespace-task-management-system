import { expect, test } from '@playwright/test';
import { addTask, fixture, loginAsGuest } from './helpers';

/**
 * Runs under the `mobile` project (iPhone 13). The Figma has no small-screen
 * frames, so this pins the responsive behaviour described in the README.
 */
test.describe('Mobile', () => {
  test('login card fits without horizontal overflow', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: "Let's get back on track" })).toBeVisible();

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflows).toBe(false);
  });

  test('sidebar is hidden behind a toggle and opens as a drawer', async ({ page }) => {
    await loginAsGuest(page);

    await expect(page.getByRole('link', { name: 'Projects' })).toBeHidden();

    await page.getByRole('button', { name: 'Toggle navigation' }).click();
    await expect(page.getByRole('link', { name: 'Projects' })).toBeVisible();

    // Navigating dismisses the drawer.
    await page.getByRole('link', { name: 'Projects' }).click();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByRole('link', { name: 'Tasks' })).toBeHidden();
  });

  test('table columns fold into a card row instead of scrolling sideways', async ({ page }) => {
    await loginAsGuest(page);
    const title = fixture('Card Row');
    await addTask(page, title, 'High');

    // The desktop column headers stay in the DOM but are suppressed below the
    // sm breakpoint, so assert on visibility rather than presence.
    await expect(page.getByText('Members', { exact: true }).first()).toBeHidden();
    await expect(page.getByText('Due Date', { exact: true }).first()).toBeHidden();
    await expect(page.getByRole('link', { name: title })).toBeVisible();

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflows).toBe(false);
  });
});
