// Firebase configuration and initialization
const firebaseConfig = {
  apiKey: "AIzaSyDbyfWUvGTHIY54AVFJqQKbVD1duIYFi7M",
  authDomain: "starboard-a9a2e.firebaseapp.com",
  databaseURL: "https://starboard-a9a2e-default-rtdb.firebaseio.com",
  projectId: "starboard-a9a2e",
  storageBucket: "starboard-a9a2e.appspot.com",
  messagingSenderId: "965257254304",
  appId: "1:965257254304:web:58ce1be7bcdec12b0540c5",
  measurementId: "G-LQN94FYG6F"
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