const { devices, defineConfig } = require("@playwright/test");

const baseURL = process.env.TEST_APP_BASE_URL || "http://127.0.0.1:3103";
const executablePath = process.env.TEST_BROWSER_EXECUTABLE_PATH;

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 180000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  use: {
    baseURL,
    trace: "on-first-retry",
    browserName: "chromium",
    ...devices["Desktop Chrome"],
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
