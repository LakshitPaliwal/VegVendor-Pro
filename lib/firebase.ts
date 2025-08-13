import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // Replace with your Firebase config
   apiKey: "AIzaSyDiApykSXxGI56L_n4f7xEpvcYevSn0i30",
  authDomain: "vegvendor-f7bb8.firebaseapp.com",
  projectId: "vegvendor-f7bb8",
  storageBucket: "vegvendor-f7bb8.firebasestorage.app",
  messagingSenderId: "253343272874",
  appId: "1:253343272874:web:e5dcd0ce425505853765d3",
  measurementId: "G-22KRNM8D0S"

};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Storage
export const storage = getStorage(app);

export default app;