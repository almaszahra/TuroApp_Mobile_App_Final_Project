// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC63ukAVPMkt3PWUDDF0weiwbKLKCpCMLY",
  authDomain: "turoappmobileappfinalproject.firebaseapp.com",
  projectId: "turoappmobileappfinalproject",
  storageBucket: "turoappmobileappfinalproject.firebasestorage.app",
  messagingSenderId: "442021809372",
  appId: "1:442021809372:web:b674c9f7b652218b04b819"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth and db for use in other files
export const auth = getAuth(app); // Critical for login
export const db = getFirestore(app); // Critical for database operations