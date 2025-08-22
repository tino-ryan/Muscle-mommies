const admin = require('firebase-admin');

const serviceAccount = {
  type: 'service_account',
  project_id: 'muscle-mommies',
  private_key_id: 'b8e9f2551b62b658e6086d333ad8b6ad7c38985b',
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email:
    'firebase-adminsdk-fbsvc@muscle-mommies.iam.gserviceaccount.com',
  client_id: '108258526107570575397',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
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
