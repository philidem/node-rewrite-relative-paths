module.exports = {
  ...require('@jupiterone/typescript-tools/config/jest'),
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.ts'],
  coverageThreshold: {
    global: {
      statements: 83,
      branches: 65,
      lines: 83,
      functions: 78,
    },
  },
};
