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
  {
    rules: {
      // This project resets local state from an effect in two deliberate places:
      // modal forms reload their draft when `open` flips, and the auth/data
      // providers clear cached workspace state when the active workspace or the
      // signed-in user changes. Both are intentional syncing of React state to an
      // external source (a Firestore subscription or a parent-controlled prop),
      // so the compiler rule is a warning here rather than an error.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
