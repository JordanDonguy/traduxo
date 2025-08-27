module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/unit/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  resetModules: false,
  setupFilesAfterEnv: ["<rootDir>/src/tests/jest.setup.ts"],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/lib/**/*.{ts,tsx,js,jsx}",
    "!**/node_modules/**",
    "!**/dist/**"
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"]
};
