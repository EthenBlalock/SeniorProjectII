// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Load Firebase configuration from Vite environment variables.
// Vite exposes variables that start with VITE_ on import.meta.env.
// Create a frontend/.env (not committed)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Basic runtime check to make debugging easier in development
if (!import.meta.env.VITE_FIREBASE_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    "VITE_FIREBASE_API_KEY is not set. Make sure you copied .env.example to .env and restarted the dev server."
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);