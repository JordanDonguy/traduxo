module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/packages/**/*.test.ts', '<rootDir>/packages/**/*.test.tsx'],
  moduleNameMapper: {
    '^@packages/(.*)$': '<rootDir>/packages/$1',
    "^@react-native-async-storage/async-storage$": "<rootDir>/packages/tests/mocks/asyncStorageMock.ts",
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  setupFilesAfterEnv: ['<rootDir>/packages/tests/jest.setup.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    'packages/**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: 'coverage/packages',
  coverageReporters: ['text', 'lcov', 'html'],
};
