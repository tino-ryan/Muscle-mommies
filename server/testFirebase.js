require('dotenv').config(); // load environment variables
const admin = require('./config/firebase');

async function testFirebase() {
  try {
    // Try fetching all users (limit 1 for quick test)
    const listUsersResult = await admin.auth().listUsers(1);
    console.log('Firebase Admin is working!');
    console.log('Fetched users:', listUsersResult.users);
  } catch (err) {
    console.error('Error testing Firebase Admin:', err);
  }
}

testFirebase();
