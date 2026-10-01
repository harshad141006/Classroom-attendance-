// Firebase Configuration
// Replace the placeholder values below with your actual Firebase project credentials.
// Get these values from Firebase Console: https://console.firebase.google.com/
// Go to Project Settings > General > Your apps > Web app (</>) > Firebase SDK snippet

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Make db available globally
window.db = db;
window.firebase = firebase;
