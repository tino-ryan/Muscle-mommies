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
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
