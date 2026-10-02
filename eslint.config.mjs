import nextVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"
import security from "eslint-plugin-security"
import sonarjs from "eslint-plugin-sonarjs"

const config = [
  ...nextVitals,
  ...nextTypescript,
  security.configs.recommended,
  sonarjs.configs.recommended,
  {
    ignores: [
      "**/.next/**",
      "**/coverage/**",
      "node_modules/**",
      ".vercel/**",
      "supabase/functions/**",
      ".kilo/**",
      "tools/services/crewai/**",
      "make_pitch_ppt.py",
    ],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "security/detect-non-literal-fs-filename": "off",
      "security/detect-object-injection": "off",
    },
  },
  {
    // Style-only rule; table-driven rewrites of every multi-case test add churn
    // without catching bugs.
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "sonarjs/parameterized-tests": "off",
    },
  },
]

export default config
