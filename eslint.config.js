import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["dist/", "node_modules/"] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "prefer-const": "warn",
      eqeqeq: ["error", "always"],
    },
  },
  {
    files: ["*.config.js", "plugins/**/*.js", "scripts/**/*.{js,mjs}"],
    languageOptions: { globals: { ...globals.node } },
  },
];
