module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: [
    "<rootDir>/nextjs/src",
    "<rootDir>/packages"
  ],
  testMatch: [
    "**/tests/unit/**/*.test.ts?(x)",
    "**/?(*.)+(spec|test).ts?(x)"
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/nextjs/src/$1',
    "^@traduxo/packages/(.*)$": "<rootDir>/packages/$1"
  },
  resetModules: false,
  setupFilesAfterEnv: [
    "<rootDir>/nextjs/src/tests/jest.setup.ts"
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    "nextjs/src/lib/**/*.{ts,tsx,js,jsx}",
    "nextjs/src/components/**/*.{ts,tsx,js,jsx}",
    "nextjs/src/context/**/*.{ts,tsx,js,jsx}",
    "packages/**/*.{ts,tsx,js,jsx}",
    "!**/node_modules/**",
    "!**/dist/**"
  ],
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["text", "lcov", "html"],
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", {
      tsconfig: "<rootDir>/tsconfig.jest.json",
    }],
  },
  transformIgnorePatterns: ["/node_modules/"],
};
