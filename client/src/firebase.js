import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "***REMOVED-FIREBASE-API-KEY***",
  authDomain: "blackbox-cd871.firebaseapp.com",
  projectId: "blackbox-cd871",
  storageBucket: "blackbox-cd871.firebasestorage.app",
  messagingSenderId: "208155051457",
  appId: "1:208155051457:web:4c390200d4525b6ff6db40",
  measurementId: "G-PJP4CR2RWC"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
