import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const isProd = import.meta.env.PROD;
const required = (value: string | undefined, key: string) => {
    if (value && value.trim()) {
        return value.trim();
    }
    if (isProd) {
        throw new Error(`Missing required Firebase env: ${key}`);
    }
    return "";
};

const firebaseConfig = {
    apiKey: required(import.meta.env.VITE_FIREBASE_API_KEY, "VITE_FIREBASE_API_KEY") || "AIzaSyBuYM71RXJtKLlehsCdlgYlFIz9E-fpYYg",
    authDomain:
        required(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, "VITE_FIREBASE_AUTH_DOMAIN") ||
        "meetrix-f4a31.firebaseapp.com",
    projectId: required(import.meta.env.VITE_FIREBASE_PROJECT_ID, "VITE_FIREBASE_PROJECT_ID") || "meetrix-f4a31",
    storageBucket:
        required(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, "VITE_FIREBASE_STORAGE_BUCKET") ||
        "meetrix-f4a31.firebasestorage.app",
    messagingSenderId:
        required(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, "VITE_FIREBASE_MESSAGING_SENDER_ID") ||
        "917076389213",
    appId: required(import.meta.env.VITE_FIREBASE_APP_ID, "VITE_FIREBASE_APP_ID") || "1:917076389213:web:d4988f37da285fd1fcccb4",
    measurementId:
        required(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, "VITE_FIREBASE_MEASUREMENT_ID") || "G-W8J91MNT2S",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
