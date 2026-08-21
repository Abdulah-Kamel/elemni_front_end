import { defineConfig } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3000);

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    headless: true,
  },
  webServer: {
    command: "npm run build && npm run start",
    url: `http://127.0.0.1:${port}`,
    env: { PORT: String(port) },
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
