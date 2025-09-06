import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDpOP0jWFQ4C9BhJ2GHQF8B4Po50cVrNxY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "exam-prod-90097.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "exam-prod-90097",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "exam-prod-90097.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "376246510882",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:376246510882:web:02f1cea96fc51c6b26717b",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-BZTB671DW2"
};

// Validate Firebase configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('Firebase configuration is missing. Please check your environment variables.');
}

// Log environment info in development
if (import.meta.env.VITE_ENV === 'development') {
  console.log('🔥 Firebase Configuration:', {
    projectId: firebaseConfig.projectId,
    environment: import.meta.env.VITE_ENV,
    hasApiKey: !!firebaseConfig.apiKey
  });
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;