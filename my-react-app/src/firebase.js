import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAh85fE9jK0Ljcd56YbRvUhq40mGx_jGww",
  authDomain: "financial-app-d37ec.firebaseapp.com",
  projectId: "financial-app-d37ec",
  storageBucket: "financial-app-d37ec.firebasestorage.app",
  messagingSenderId: "566480507144",
  appId: "1:566480507144:web:98f8674c9b7c1c1f18dcbd",
  measurementId: "G-BKKEKB0CWE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);