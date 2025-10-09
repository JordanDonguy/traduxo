/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",

  roots: ["<rootDir>/nextjs/src", "<rootDir>/packages"],

  testMatch: [
    "**/tests/unit/**/*.test.ts?(x)",
    "<rootDir>/packages/**/*.test.ts?(x)",
    "**/?(*.)+(spec|test).ts?(x)"
  ],

  moduleNameMapper: {
    // Next.js absolute imports
    "^@/(.*)$": "<rootDir>/nextjs/src/$1",

    // Shared packages
    "^@traduxo/packages/(.*)$": "<rootDir>/packages/$1",

    // React Native mocks
    "^expo-secure-store$": "<rootDir>packages/tests/mocks/expoSecureStore.ts",
    "^react-native-localize$": "<rootDir>/packages/tests/mocks/reactNativeLocalizeMock.ts",
    "^react-native-toast-message$": "<rootDir>/packages/tests/mocks/reactNativeToastMock.ts"
  },

  setupFilesAfterEnv: [
    "<rootDir>/nextjs/src/tests/jest.setup.ts",
    "<rootDir>/packages/tests/jest.setup.ts"
  ],

  resetModules: false,

  collectCoverage: true,
  collectCoverageFrom: [
    "nextjs/src/lib/**/*.{ts,tsx,js,jsx}",
    "nextjs/src/components/**/*.{ts,tsx,js,jsx}",
    "nextjs/src/contexts/**/*.{ts,tsx,js,jsx}",
    "packages/**/*.{ts,tsx,js,jsx}",
    "!**/node_modules/**",
    "!**/dist/**",
    "!packages/**/AppProviderRn.tsx"
  ],
  coveragePathIgnorePatterns: ["packages/types"],
  coverageDirectory: "<rootDir>/coverage",
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
