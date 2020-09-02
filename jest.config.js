module.exports = {
  ...require('@jupiterone/typescript-tools/config/jest'),
  clearMocks: true,
  moduleNameMapper: {
    '~/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/test/**/*.test.ts'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts'],
  coverageThreshold: {
    global: {
      statements: 83,
      branches: 68,
      lines: 83,
      functions: 78,
    },
  },
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  testEnvironment: 'node',
};
