import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyB-0HpHGBctqWmZGpjaTycwIrsK25Wcm3Y",
  authDomain: "product-shelf-inventory.firebaseapp.com",
  projectId: "product-shelf-inventory",
  storageBucket: "product-shelf-inventory.firebasestorage.app",
  messagingSenderId: "749155710210",
  appId: "1:749155710210:web:53db081a3b8c4508817e1b",
  measurementId: "G-WSMYK2H8WH",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db };
