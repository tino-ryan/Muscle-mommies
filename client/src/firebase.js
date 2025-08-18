/*/ Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCQY-9dZw6Oe8dmuDK3kahh74Rq4pDJTog',
  authDomain: 'muscle-mommies.firebaseapp.com',
  projectId: 'muscle-mommies',
  storageBucket: 'muscle-mommies.firebasestorage.app',
  messagingSenderId: '725884075938',
  appId: '1:725884075938:web:25908d8bac8a5fd04dfcfb',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);*/
