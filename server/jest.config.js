module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    '**/*.js',
    '!index.js',
    '!config/firebase.js', // purely config
    '!testFirebase.js', // a test utility
    '!coverage/**', // Exclude coverage reports
    '!jest.config.js',
    '!**/__tests__/**',
    '!**/__mocks__/**',
  ],
  coverageDirectory: './coverage',
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  moduleNameMapper: {
    '^firebase-admin$': '<rootDir>/__mocks__/firebase.js',
  },
};
