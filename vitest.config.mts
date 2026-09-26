import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Picks up the "@/*" -> "./src/*" alias from tsconfig.json.
    tsconfigPaths: true,
  },
  test: {
    /**
     * The node environment has no `window`, and `src/lib/db.ts` guards every
     * localStorage call on it — so the store runs purely in memory here. That
     * is exactly what these tests want: no persistence leaking between files.
     */
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
