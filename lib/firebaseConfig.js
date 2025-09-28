import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 🔹 Configuration Firebase via variables d'environnement
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 🔹 Initialisation Firebase
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// 🔹 Google Drive API (client-side)
export const GOOGLE_DRIVE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID;
export const GOOGLE_DRIVE_FOLDER_ID = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID;

// 🔹 Google OAuth / Service Account (pour serveur)
export const GOOGLE_SERVICE_ACCOUNT = process.env.NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT;
export const FIREBASE_SERVICE_ACCOUNT_KEY = process.env.NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEY;
export const GOOGLE_CLIENT_SECRET = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET;
export const GOOGLE_REDIRECT_URL = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URL;

// 🔹 Firebase Cloud Messaging
export const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY;