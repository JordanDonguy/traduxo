module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/packages/**/*.test.ts', '<rootDir>/packages/**/*.test.tsx'],
  moduleNameMapper: {
    '^@traduxo/packages/(.*)$': '<rootDir>/packages/$1',
    "^@react-native-async-storage/async-storage$": "<rootDir>/packages/tests/mocks/asyncStorageMock.ts",
    "^react-native-localize$": "<rootDir>/packages/tests/mocks/reactNativeLocalizeMock.ts",
    "^react-native-toast-message$": "<rootDir>/packages/tests/mocks/reactNativeToastMock.ts"
  },
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", {
      tsconfig: "tsconfig.jest.json",
    }],
  },
  setupFilesAfterEnv: ['<rootDir>/packages/tests/jest.setup.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    'packages/**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!packages/**/AppProviderRn.tsx'
  ],
  coverageDirectory: 'coverage/packages',
  coverageReporters: ['text', 'lcov', 'html'],
};
