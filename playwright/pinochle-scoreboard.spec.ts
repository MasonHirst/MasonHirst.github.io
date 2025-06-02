import { test, expect } from '@playwright/test';

test.describe('Pinochle Scoreboard Page', () => {
  test('should display correct page title and buttons', async ({ page }) => {
    // Navigate to the Pinochle Scoreboard page
    await page.goto('/games/pinochle-scoreboard');

    // Check the page title (browser tab title)
    await expect(page).toHaveTitle(/Pinochle|Scoreboard|Games/i); // Adjust regex as needed

    // Check for key buttons
    await expect(page.getByRole('button', { name: /Start Game/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Add Team/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Reset Score/i })).toBeVisible();
  });
});