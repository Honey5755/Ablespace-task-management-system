import { expect, test } from '@playwright/test';
import { addTask, loginAsGuest, switchView } from './helpers';

test.describe('Task list', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsGuest(page);
  });

  test('renders the three groups drawn in the design, each with an Add Task footer', async ({
    page,
  }) => {
    for (const group of ['To Do', 'Doing', 'Completed']) {
      await expect(page.getByRole('button', { name: new RegExp(`^${group}$`) })).toBeVisible();
    }

    // Reviewer comment #1 claimed these were inconsistent; they are not.
    await expect(page.locator('main section > div > button', { hasText: 'Add Task' })).toHaveCount(3);
  });

  test('group headers carry no count badge', async ({ page }) => {
    await expect(page.getByRole('button', { name: /^To Do$/ })).toHaveText('To Do');
  });

  test('shows every column from the design', async ({ page }) => {
    await addTask(page, 'Design Homepage', 'Urgent');

    for (const column of ['Task', 'Priority', 'Members', 'Due Date', 'Actions']) {
      await expect(page.getByText(column, { exact: true }).first()).toBeVisible();
    }
    // Rows render the priority twice — a desktop cell and a mobile meta line
    // hidden by a breakpoint — so assert on the one that is actually painted.
    await expect(page.getByText('Urgent', { exact: true })).toHaveCount(2);
    await expect(
      page.locator('.sm\\:block').filter({ hasText: 'Urgent' }).first(),
    ).toBeVisible();
  });

  test('creates, edits and deletes a task', async ({ page }) => {
    await addTask(page, 'Write API Documentation');

    await page.getByRole('button', { name: /Actions for Write API Documentation/ }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await page.getByLabel('Task', { exact: true }).fill('Write API Docs');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByRole('link', { name: 'Write API Docs' })).toBeVisible();

    await page.getByRole('button', { name: /Actions for Write API Docs/ }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(page.getByRole('link', { name: 'Write API Docs' })).toHaveCount(0);
  });

  test('moves a task between groups via the row menu', async ({ page }) => {
    await addTask(page, 'Test Payment Gateway');

    await page.getByRole('button', { name: /Actions for Test Payment Gateway/ }).click();

    // Driven by keyboard on purpose. Radix closes a submenu when the pointer
    // leaves the trigger's safe triangle, which makes hover-then-click racy —
    // and this doubles as a check that the menus are keyboard-navigable.
    const status = page.getByRole('menuitem', { name: 'Status' });
    await status.hover();
    await status.press('ArrowRight');
    await page.getByRole('menuitem', { name: 'Doing' }).press('Enter');

    const doing = page.locator('section').filter({ hasText: 'Doing' }).first();
    await expect(doing.getByRole('link', { name: 'Test Payment Gateway' })).toBeVisible();
  });
});

test.describe('Search and filters', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsGuest(page);
    await addTask(page, 'Design Homepage', 'High');
    await addTask(page, 'Develop Login Feature', 'Low');
  });

  test('⌘F opens search and narrows the list', async ({ page }) => {
    await page.keyboard.press('ControlOrMeta+f');
    await page.getByRole('textbox', { name: 'Search tasks' }).fill('Design');

    await expect(page.getByRole('link', { name: 'Design Homepage' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Develop Login Feature' })).toHaveCount(0);
  });

  test('search is case-insensitive', async ({ page }) => {
    await page.keyboard.press('ControlOrMeta+f');
    // Deliberately the wrong case. PostgreSQL LIKE is case-sensitive, so this
    // fails unless the query sets Prisma's `mode: 'insensitive'`.
    await page.getByRole('textbox', { name: 'Search tasks' }).fill('dESIGN hOMEPAGE');

    await expect(page.getByRole('link', { name: 'Design Homepage' })).toBeVisible();
  });

  test('a search with no matches offers a way back', async ({ page }) => {
    await page.keyboard.press('ControlOrMeta+f');
    await page.getByRole('textbox', { name: 'Search tasks' }).fill('zzz-no-match');

    await expect(page.getByText('No matching tasks')).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(page.getByRole('link', { name: 'Design Homepage' })).toBeVisible();
  });

  test('filters by priority', async ({ page }) => {
    await page.getByRole('button', { name: 'Filter tasks' }).click();
    const priority = page.getByRole('menuitem', { name: 'Priority' });
    await priority.hover();
    await priority.press('ArrowRight');
    await page.getByRole('menuitem', { name: 'High' }).press('Enter');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');

    await expect(page.getByRole('link', { name: 'Design Homepage' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Develop Login Feature' })).toHaveCount(0);
  });

  test('Fields toggles column visibility and lists Members only once', async ({ page }) => {
    await page.getByRole('button', { name: 'Fields' }).click();

    // The Figma lists "Members" twice; a duplicate control would be our bug.
    await expect(page.locator('[role="menu"] label', { hasText: 'Members' })).toHaveCount(1);

    await page.locator('[role="menu"] label', { hasText: 'Due Date' }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByText('Due Date', { exact: true })).toHaveCount(0);
  });
});

test.describe('Board view', () => {
  test('drag reorders within a column and persists', async ({ page }) => {
    await loginAsGuest(page);
    for (const title of ['Alpha', 'Bravo', 'Charlie']) await addTask(page, title);
    await switchView(page, 'Board');

    const todo = page.locator('section').filter({ hasText: 'To Do' }).first();
    await expect(todo.locator('article a')).toHaveText(['Alpha', 'Bravo', 'Charlie']);

    const charlie = page.locator('article').filter({ hasText: 'Charlie' }).first();
    const alpha = page.locator('article').filter({ hasText: 'Alpha' }).first();
    const from = (await charlie.boundingBox())!;
    const to = (await alpha.boundingBox())!;

    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width / 2, to.y + 4, { steps: 12 });
    await page.mouse.move(to.x + to.width / 2, to.y + 2, { steps: 4 });
    await page.mouse.up();

    await expect(todo.locator('article a').first()).toHaveText('Charlie');

    // The ordering must survive a reload — i.e. it reached the server.
    await page.reload();
    await switchView(page, 'Board');
    await expect(
      page.locator('section').filter({ hasText: 'To Do' }).first().locator('article a').first(),
    ).toHaveText('Charlie');
  });

  test('drag between columns changes status and persists', async ({ page }) => {
    await loginAsGuest(page);
    await addTask(page, 'Charlie');
    await switchView(page, 'Board');

    const card = page.locator('article').filter({ hasText: 'Charlie' }).first();
    const doing = page.locator('section').filter({ hasText: 'Doing' }).first();
    const from = (await card.boundingBox())!;
    const target = (await doing.boundingBox())!;

    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(target.x + target.width / 2, target.y + 120, { steps: 14 });
    await page.mouse.up();

    await page.reload();
    await expect(
      page.locator('section').filter({ hasText: 'Doing' }).first().getByRole('link', { name: 'Charlie' }),
    ).toBeVisible();
  });
});

test.describe('Task detail', () => {
  test('shows subtasks and comments, and records activity', async ({ page }) => {
    await loginAsGuest(page);
    await addTask(page, 'Write API Documentation');
    await page.getByRole('link', { name: 'Write API Documentation' }).click();

    // The Figma heads the comment thread "Subtasks" too — a duplicate-label bug.
    await expect(page.getByRole('heading', { name: 'Subtasks' })).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Comments' })).toHaveCount(1);

    await page.getByRole('button', { name: 'Add Subtasks' }).click();
    await page.getByPlaceholder('Subtask title').fill('Subtask 1');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByRole('link', { name: 'Subtask 1' })).toBeVisible();

    await page.getByPlaceholder('Add a comment…').fill('Looks good');
    await page.getByRole('button', { name: 'Post comment' }).click();
    await expect(page.getByText('Looks good')).toBeVisible();

    await expect(page.getByText('created this task')).toBeVisible();
  });

  test('changing priority in the Details rail writes to the Updates feed', async ({ page }) => {
    await loginAsGuest(page);
    await addTask(page, 'Design Homepage');
    await page.getByRole('link', { name: 'Design Homepage' }).click();

    await page.getByRole('button', { name: /No Priority/ }).first().click();
    await page.getByRole('menuitem', { name: 'Urgent' }).click();

    await expect(page.getByText(/changed priority from No priority to Urgent/)).toBeVisible();
  });
});
