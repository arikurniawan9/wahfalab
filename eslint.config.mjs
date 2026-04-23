import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Relax some rules for existing codebase
  {
    rules: {
      // Downgrade no-explicit-any to warning instead of error
      "@typescript-eslint/no-explicit-any": "warn",
      // Downgrade react-hooks/exhaustive-deps to warning
      "react-hooks/exhaustive-deps": "warn",
      // Allow unused vars prefixed with _ (for future use)
      "@typescript-eslint/no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],
      // Downgrade unescaped entities to warning (React handles this fine)
      "react/no-unescaped-entities": "off",
      // Allow require for dynamic imports in client components
      "@typescript-eslint/no-require-imports": "warn",
    },
  },
  {
    ignores: [
      "src/generated/**",
    ],
  },
]);

export default eslintConfig;
