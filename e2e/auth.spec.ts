import { expect, test } from '@playwright/test';
import { addTask, loginAsGuest } from './helpers';

test.describe('Login', () => {
  test('matches the copy in the design', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: "Let's get back on track" })).toBeVisible();
    // The design's subtitle promises an email field the card does not have.
    // Kept verbatim — see README.
    await expect(page.getByText('Enter your email below to login to your account.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue as Guest' })).toBeEnabled();
  });

  test('renders Google sign-in but leaves it inert', async ({ page }) => {
    await page.goto('/login');
    // Drawn in the frame, so it is present; OAuth credentials are not supplied,
    // so it must not look actionable.
    await expect(page.getByRole('button', { name: /Login with Google/ })).toBeDisabled();
  });

  test('guest login lands on the task list and survives a reload', async ({ page }) => {
    await loginAsGuest(page);
    await expect(page).toHaveURL(/\/tasks$/);

    await page.reload();
    await expect(page).toHaveURL(/\/tasks$/);
    await expect(page.getByRole('button', { name: /^To Do$/ })).toBeVisible();
  });

  test('protected routes bounce an unauthenticated visitor to login', async ({ page }) => {
    await page.goto('/tasks');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('each guest session gets an isolated workspace', async ({ page, browser }) => {
    await loginAsGuest(page);
    await addTask(page, 'Only mine');
    await expect(page.getByRole('link', { name: 'Only mine' })).toBeVisible();

    // A second, unrelated guest must not see the first guest's data.
    const other = await browser.newContext();
    const otherPage = await other.newPage();
    await loginAsGuest(otherPage);
    await expect(otherPage.getByRole('link', { name: 'Only mine' })).toHaveCount(0);
    await other.close();
  });
});

test.describe('Projects', () => {
  test('creates a project and labels the button as the design does', async ({ page }) => {
    await loginAsGuest(page);
    await page.getByRole('link', { name: 'Projects' }).click();

    // The Figma flips between "+ Add Project" and "+ Add Task" across frames.
    await expect(page.getByRole('button', { name: 'Add Project', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Task', exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: 'Add Project', exact: true }).click();
    await page.getByLabel('Project', { exact: true }).fill('Design Homepage');
    await page.getByRole('button', { name: 'Add project', exact: true }).click();

    await expect(page.getByText('Design Homepage')).toBeVisible();
  });
});
