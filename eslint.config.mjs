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
      ".next/**",
      "node_modules/**",
      ".vercel/**",
      "supabase/functions/**",
      ".kilo/**",
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
]

export default config
