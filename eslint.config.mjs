import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // API-testsviten och e2e-skripten körs direkt av Node (node --test,
  // node e2e-*.js) och aldrig genom Next-bygget. De är med flit CommonJS,
  // så require() är rätt anropsform där — inte något att bygga bort.
  {
    files: ["tests/**/*.js", "e2e-*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
