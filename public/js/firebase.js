// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyB24u80Kn80y4GqSqZ_FciCwJfiF1dS6DA",
  authDomain: "innox-bank-e3cbf.firebaseapp.com",
  projectId: "innox-bank-e3cbf",
  storageBucket: "innox-bank-e3cbf.appspot.com",
  messagingSenderId: "320402268808",
  appId: "1:320402268808:web:0b75907b28a344470d353d",
  measurementId: "G-KFGKNGP8DL",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
