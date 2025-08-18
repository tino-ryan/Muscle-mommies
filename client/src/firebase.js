import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY, // keep this in .env
  authDomain: 'muscle-mommies.firebaseapp.com',
  projectId: 'muscle-mommies',
  storageBucket: 'muscle-mommies.appspot.com',
  messagingSenderId: '725884075938',
  appId: '1:725884075938:web:25908d8bac8a5fd04dfcfb',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
