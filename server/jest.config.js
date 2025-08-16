module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    '**/*.js', // all JS files in the server folder
    '!index.js', // ignore entry point if needed
    '!**/__tests__/**', // ignore test files
  ],
  coverageDirectory: './coverage', // optional, default
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
};
