import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup-env.js"],
    // mongodb-memory-server downloads a binary on first run — be generous
    hookTimeout: 180_000,
    testTimeout: 30_000,
    // test files share one mongoose connection; run them sequentially
    fileParallelism: false,
  },
})
