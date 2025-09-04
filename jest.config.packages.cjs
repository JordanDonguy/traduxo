module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/packages/**/*.test.ts', '<rootDir>/packages/**/*.test.tsx'],
  moduleNameMapper: {
    '^@utils/(.*)$': '<rootDir>/packages/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  setupFilesAfterEnv: [],
  collectCoverage: true,
  collectCoverageFrom: [
    'packages/**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: 'coverage/packages',
  coverageReporters: ['text', 'lcov', 'html'],
};
