import { defineConfig, devices } from '@playwright/test';

/**
 * Boots the API and web app itself, so `npm run test:e2e` works from a clean
 * checkout with no servers already running.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 950 } },
      // The responsive spec asserts small-screen behaviour; it would fail here.
      testIgnore: /responsive\.spec\.ts/,
    },
    {
      name: 'mobile',
      // Pixel 5 is Chromium-based, so it needs no extra browser download.
      use: { ...devices['Pixel 5'] },
      testMatch: /responsive\.spec\.ts/,
    },
  ],

  webServer: [
    {
      command: 'npm run start -w apps/api',
      url: 'http://localhost:4000/api/auth/me',
      // /auth/me answers 401 unauthenticated — that still proves it is listening.
      ignoreHTTPSErrors: true,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm run start -w apps/web',
      url: 'http://localhost:3000/login',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
