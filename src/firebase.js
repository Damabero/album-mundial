import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB8HRUZexCNOjyy8kIWDOEx3YZnDLq3ZbE",
  authDomain: "album-mundial-ce080.firebaseapp.com",
  projectId: "album-mundial-ce080",
  storageBucket: "album-mundial-ce080.appspot.com",
  messagingSenderId: "581513198557",
  appId: "1:581513198557:web:f3d95fa1c9123d5a93d434"
};

const firebaseApp = initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
