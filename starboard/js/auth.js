// Firebase configuration and initialization
const firebaseConfig = {
  apiKey: "AIzaSyAKub2UWzj08vywPYuQ1SHNruMNUa4mVAw",
  authDomain: "dbs1-b8402.firebaseapp.com",
  databaseURL: "https://dbs1-b8402-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "dbs1-b8402",
  storageBucket: "dbs1-b8402.firebasestorage.app",
  messagingSenderId: "149677040378",
  appId: "1:149677040378:web:07b14d473f0559021cdf43",
  measurementId: "G-ZZ2ZEPPJE5"
};


// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Auth functions
function login(email, password) {
  return auth.signInWithEmailAndPassword(email, password);
}

function logout() {
  return auth.signOut();
}

function getUserRole(uid) {
  return database.ref(`roles/${uid}`).once('value')
    .then((snapshot) => snapshot.val());
}

function sendPasswordResetEmail(email) {
  return auth.sendPasswordResetEmail(email);
}

// Make available globally
window.auth = auth;
window.database = database;
window.firebaseHelpers = {
  login,
  logout,
  getUserRole,
  sendPasswordResetEmail
};