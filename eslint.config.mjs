import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "playwright.config.js", "scripts/**", "scratch/**"]),
  {
    rules: {
      // Downgraded to warn: calling setState inside an effect is intentional in
      // ai-documents-page.tsx to synchronize local form state from server-fetched setup data.
      "react-hooks/set-state-in-effect": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/error-boundaries": "off",
      "react-hooks/purity": "warn"
    },
  },
]);
