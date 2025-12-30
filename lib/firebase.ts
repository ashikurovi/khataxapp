// lib/firebase.ts
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Hard-coded Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDeKcH15ABj7wvg--LIYoY-s1wv5yknhso",
  authDomain: "khatax-ca5d8.firebaseapp.com",
  projectId: "khatax-ca5d8",
  storageBucket: "khatax-ca5d8.appspot.com",
  messagingSenderId: "680033115592",
  appId: "1:680033115592:web:06ce35c6710f42f9c334fd",
};

let app: FirebaseApp;
let auth: Auth;
let storage: FirebaseStorage;

if (typeof window !== "undefined") {
  // Initialize Firebase only once
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  storage = getStorage(app);
}

export { app, auth, storage };
