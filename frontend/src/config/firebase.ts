// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCb6KuYB913i5Nt3ONoLvLaz4I4fuCG5w4",
  authDomain: "project1-eb515.firebaseapp.com",
  projectId: "project1-eb515",
  storageBucket: "project1-eb515.firebasestorage.app",
  messagingSenderId: "32234316469",
  appId: "1:32234316469:web:5a6dc4079871d9b95494fc",
  measurementId: "G-M7JW23NZB2"
};

// Initialize Firebase safely (avoid multiple initializations in dev hot reload)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Analytics conditionally (supported in browser environments)
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics fallback if blocked by ad-blocker or unsupported environment
  });
}

export default app;
