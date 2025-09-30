// __mocks__/firebase.js
const firebaseMock = require('firebase-mock');
const mockAuth = new firebaseMock.MockAuthentication();
const mockFirestore = new firebaseMock.MockFirestore();
const mockStorage = new firebaseMock.MockStorage();

const mockApp = new firebaseMock.MockFirebaseSdk(
  null,
  () => mockAuth,
  () => mockFirestore,
  () => mockStorage
);

// Mock admin.initializeApp
mockApp.initializeApp = jest.fn();

// Mock other admin methods
mockApp.firestore = () => mockFirestore;
mockApp.auth = () => mockAuth;
mockApp.storage = () => mockStorage;

// Mock FieldValue for timestamps
mockApp.firestore.FieldValue = {
  serverTimestamp: () => new Date(),
};
mockApp.firestore.Timestamp = {
  fromDate: (date) => date, // just return the JS Date for testing
};
module.exports = mockApp;
