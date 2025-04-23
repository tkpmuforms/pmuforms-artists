import {
  FirebaseApp,
  FirebaseOptions,
  getApps,
  initializeApp,
} from "firebase/app";
import {
  Auth,
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  UserCredential,
} from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import { FirebaseStorage, getStorage } from "firebase/storage";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.VITE_API_KEY,
  authDomain: process.env.VITE_AUTH_DOMAIN,
  databaseURL: process.env.VITE_DATABASE_URL,
  projectId: process.env.VITE_PROJECT_ID,
  storageBucket: process.env.VITE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_APP_ID,
  measurementId: process.env.VITE_MEASUREMENT_ID,
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth: Auth = getAuth(app);
const firestore: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

// Providers
const googleProvider: GoogleAuthProvider = new GoogleAuthProvider();
const facebookProvider: FacebookAuthProvider = new FacebookAuthProvider();

// Export types for better type checking
export type {
  UserCredential,
  Auth,
  Firestore,
  FirebaseStorage,
  GoogleAuthProvider,
  FacebookAuthProvider,
};

// Export initialized services and providers
export {
  app,
  auth,
  storage,
  firestore,
  googleProvider,
  facebookProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
};
