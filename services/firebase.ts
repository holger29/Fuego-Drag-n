// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBA8w5VgcsphL4FsDlMziln3gNLzdKoC6U",
  authDomain: "fuego-dragon-app-49ff1.firebaseapp.com",
  projectId: "fuego-dragon-app-49ff1",
  storageBucket: "fuego-dragon-app-49ff1.firebasestorage.app",
  messagingSenderId: "11277757080",
  appId: "1:11277757080:web:bac66dc3e277d438e13eed",
  measurementId: "G-08TSKV1CHY"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);