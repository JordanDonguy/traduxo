module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/unit/backend/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  resetModules: false,
  setupFilesAfterEnv: ["<rootDir>/src/tests/jest.setup.ts"],
};
