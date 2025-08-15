module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
    transform: {
      '^.+\\.(js|jsx)$': 'babel-jest'  // This now handles both .js and .jsx
    },
    moduleNameMapper: {
      '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
    },
    collectCoverageFrom: [
      'src/**/*.{js,jsx}',  
      '!src/index.js',
      '!src/reportWebVitals.js',
      '!src/firebase.js',
      '!src/App.jsx'
    ],
    coverageThreshold: {
      global: {
        branches: 0,
        functions: 0,
        lines: 0,
        statements: 0
      }
    },
    moduleFileExtensions: ['js', 'jsx'],
    testMatch: [
      '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
      '<rootDir>/src/**/*.{test,spec}.{js,jsx}'
    ]
};
