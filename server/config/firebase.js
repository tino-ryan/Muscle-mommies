const admin = require('firebase-admin');

const serviceAccount = {
  type: 'service_account',
  project_id: 'muscle-mommies',
  private_key_id: 'b8e9f2551b62b658e6086d333ad8b6ad7c38985b',
  private_key:
    '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDNfOL5DyCQvUTa\ndmR2II903oJ/alAhIrYrAxptmHCmEMK0RLnytBfTjUW2qE+9RPmqsg6eB1eJbJvd\nxX8e/n0Bq8uyd2zBZVRB0ryxjwvqQn5aNDjAKmu82SQ4kUla4SAKo9edvZxIsf3m\noRRA7/sE772lE52Bt+IkU63MzDatIiAWpJWxZOuQwfneuspB3WX6FTBN2pI4acet\ny6UP0hGQEcGN2RqG5dWi81Ql1XlrnbCJeFmBloo6JbUQPch15x8I7qKbqzPZ+uk4\nwLDsjuI1MWrpI8+kJeDQZvg0peCqC4a6o/FMKUPQy/3OvnPZV6bmmN7KFzOZ1OaE\ndSkYBo+DAgMBAAECggEAUC2YFG0aHE+1g3ZpmYv33baKfbPaQyubn+nMkJHH9owY\npKUiVvh9SX7Ygj5nKqc0sa1bNb8QoV7+7EgI42uSFCpXxzGA/m8OssZK+Q8jK4s5\naPHyaMzEkAG799R8plisG2q1kWdwCQ9mTexxDit1KwZuXXBrZzd8Jgd+i6fs951j\nlQfdTrk9hKhzGsSVtDzbUwgy4DCYqthIurdmnIDKHuy+01vi77wgVW3tlCZvR4Lj\noy3LMZx7I0dG1rM5zin1nMVajby7cpYW73aWbLD09Z4dsstKgyFN4li8QcVOOo23\nvsMXTPYLh9eNRx1P+RSsMnLbHEPLEFQSwRy7havFOQKBgQDq+WCQ3JfiXkQ81YyE\n3htF7TQQzYN6ZSacKaAV4IgkeUp8usxR0AbrZL/908slvlZvtKucWV4I9QliyggE\nnv0Yneai7V4KTxoforGjuo5SlUXNz9edCfsiDtIM1zGd5Sk5Gccyaz84jXOaYTfH\noL6QYTRkJnUvL0oJVMQgUhpiCwKBgQDf4A7fDu4ezqucozr4cNeeVkafOYGyabXa\nFzPZqymk2fZHV1cQU+4TgiN4LWjQEN4VrXJW61OApYyBTo285duvtEnDg1IZ1joB\nrZb6nzHnirS8AlZSJKNRuSlA5SyzfvjBV6cFKpKhu1Foz+opobvMgKBs2kZRHs/P\nWBJWFIWraQKBgFCd8LCizoV+3CCXD9gCMA9Eu8lMCWDz1VRcv6zh1TPWXWT/3dvv\n6H/YmDpo8NjpPdSjgwFoc+fU0jyPnkKfnaxVeGzLzajxzL+v3QyUlAHnbwSW253o\nb74WoaCAMGjA1+zcWEiHHTC070W3NyEJmHgGsafuvePLcLZU29lO8fhTAoGANDa4\noTOFO/AtvEGhvlHrKAWtQPOTmT3oaO4ibLDr7IPdWbQ4HRnGHAytIxlMKcLVWS7z\nzOvjtMxnobzld9oQS8F7trrJCjeZncyTuu4oIH2MO5E7+rqK0MOjqHwK2e5SLB26\nWY0dV9UtXomnboBHIaIaSGj8H21VQGGlHSh6KIkCgYEA0SId2P8SWDstlnzcvF9h\n71UYTRmdwefj6GmLt1HBV+BwuG3uzs0teKSmTOWxUWwOnxEfYfJq8igEy+6BXALd\n/Fn4o8I+2q5FULROojacLcptL9gJL6lcSSDNpsD/KzWJ/s3GCIMVBSRAekzBWgRg\nFdAd9wDlDrPOmn9kwIAvAAA=\n-----END PRIVATE KEY-----\n',
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
