// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA87pVgfC0k5AsIU77w_Z4W7fGij6XyC9s",
  authDomain: "app-1-40c29.firebaseapp.com",
  projectId: "app-1-40c29",
  storageBucket: "app-1-40c29.firebasestorage.app",
  messagingSenderId: "545314679061",
  appId: "1:545314679061:web:f2498ac5c4ad946a40e11c",
  measurementId: "G-SB492Y7X4L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize services
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, auth, firestore, storage };