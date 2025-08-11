const admin = require('firebase-admin');

const serviceAccount = {
  type: 'service_account',
  private_key_id: '441bd4548cd8efa2a8480ff3ed3c9a57656b52fd',
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  token_uri: 'https://oauth2.googleapis.com/token',
  client_id: '108258526107570575397',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url:
    'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40muscle-mommies.iam.gserviceaccount.com',
  universe_domain: 'googleapis.com',
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
