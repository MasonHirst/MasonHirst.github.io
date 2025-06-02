// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './playwright', // Your test folder
  use: {
    baseURL: 'http://localhost:4200', // Replace with your dev server URL
    browserName: 'chromium', // 'firefox' or 'webkit' also valid
    headless: true, // run in headless mode by default
    // viewport: { width: 1280, height: 720 },
    trace: 'on'
  },
});