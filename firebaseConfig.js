import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAgghISCaJV_CpB0kDtRVuPCHjtwiShvxY",
  authDomain: "sonara-302a2.firebaseapp.com",
  projectId: "sonara-302a2",
  storageBucket: "sonara-302a2.firebasestorage.app",
  messagingSenderId: "886050447017",
  appId: "1:886050447017:web:b38ec19412aaff229f13b8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;