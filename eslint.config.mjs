import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const physicalDirectionBan = {
  rules: {
    "no-restricted-syntax": [
      "error",
      {
        selector:
          'JSXAttribute[name.name="className"] Literal[value=/\\b(?:ml|mr|pl|pr)-\\d+|\\bleft-\\d+|\\bright-\\d+|\\btext-left\\b|\\btext-right\\b/]',
        message:
          "Physical-direction utilities (ml-, mr-, pl-, pr-, left-, right-, text-left, text-right) are banned. Use logical properties (ms-, me-, ps-, pe-, start-, end-, text-start, text-end) instead.",
      },
    ],
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  physicalDirectionBan,
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
