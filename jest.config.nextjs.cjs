/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",

  // Only Next.js source folder
  roots: ["<rootDir>/nextjs/src"],

  // Match test files inside Next.js
  testMatch: [
    "**/tests/unit/**/*.test.ts?(x)",
    "**/?(*.)+(spec|test).ts?(x)"
  ],

  moduleNameMapper: {
    // Next.js absolute imports
    "^@/(.*)$": "<rootDir>/nextjs/src/$1",

    // Shared packages (can still import them)
    "^@traduxo/packages/(.*)$": "<rootDir>/packages/$1"
  },

  setupFilesAfterEnv: ["<rootDir>/nextjs/src/tests/jest.setup.ts"],

  resetModules: false,

  collectCoverage: true,
  collectCoverageFrom: [
    "nextjs/src/lib/**/*.{ts,tsx,js,jsx}",
    "nextjs/src/components/**/*.{ts,tsx,js,jsx}",
    "nextjs/src/contexts/**/*.{ts,tsx,js,jsx}",
    "!**/node_modules/**",
    "!**/dist/**"
  ],
  coverageDirectory: "<rootDir>/coverage/nextjs",
  coverageReporters: ["text", "lcov", "html"],

  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.jest.json"
      }
    ]
  },

  transformIgnorePatterns: ["/node_modules/"]
};
