import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  {
    ignores: [
      ".next/**",
      "coverage/**",
      "dist/**",
      "global.d.ts",
      "nextjs/.next/types/**",
      "nextjs/next-env.d.ts",
      "nextjs/types/**",
      "nextjs/coverage/**"
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        project: [
          "./tsconfig.json",
          "./nextjs/tsconfig.json",
          "./packages/tsconfig.json",
        ],
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // ⚡ Correct usage: severity + options array
      "@typescript-eslint/no-unused-expressions": [
        "error",
        {
          allowShortCircuit: false,
          allowTaggedTemplates: false,
          allowTernary: false,
        },
      ],
    },
  },
];
