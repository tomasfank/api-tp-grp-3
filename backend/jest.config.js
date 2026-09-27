module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/__tests__/**'],
  coverageDirectory: 'coverage',
  // uuid v14+ is ESM-only; provide a CJS-compatible shim so Jest can load it
  moduleNameMapper: {
    '^uuid$': '<rootDir>/src/__mocks__/uuid.js',
  },
};
