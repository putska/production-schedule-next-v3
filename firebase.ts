import { getApp, getApps, initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfWY2hZ13YzjrhuzYPjlqvyB_0etyktJo",
  authDomain: "production-schedule-next-2.firebaseapp.com",
  databaseURL: "https://production-schedule-next-2-default-rtdb.firebaseio.com",
  projectId: "production-schedule-next-2",
  storageBucket: "production-schedule-next-2.appspot.com",
  messagingSenderId: "723594358014",
  appId: "1:723594358014:web:9ea514c1142b74b10e49af",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };
