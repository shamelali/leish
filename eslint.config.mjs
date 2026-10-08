import nextVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"
import security from "eslint-plugin-security"
import sonarjs from "eslint-plugin-sonarjs"
import prettier from "eslint-config-prettier"

const config = [
  ...nextVitals,
  ...nextTypescript,
  security.configs.recommended,
  sonarjs.configs.recommended,
  prettier,
  {
    ignores: [
      "**/.next/**",
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
]

export default config
