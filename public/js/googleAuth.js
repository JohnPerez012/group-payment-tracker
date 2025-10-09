import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// ✅ Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyClZuFFFxtiwJar_YLrC8-G4ZSC5kSJJdU",
  authDomain: "group-payment-tracker.firebaseapp.com",
  projectId: "group-payment-tracker",
  storageBucket: "group-payment-tracker.firebasestorage.app",
  messagingSenderId: "208078945785",
  appId: "1:208078945785:web:5164201a43e0bd37c8d128"
};

// ✅ Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let currentUser = null;

// ✅ Elements
const authBtn = document.getElementById("auth-btn");
const userIdEl = document.getElementById("user-id");

// ✅ Utility: show notification
function showNotification(msg, type = "info") {
  const n = document.createElement("div");
  n.className = `fixed top-4 right-4 p-3 rounded text-white ${
    type === "success" ? "bg-green-500" :
    type === "error" ? "bg-red-500" :
    "bg-blue-500"
  }`;
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 3000);
}

// ✅ Update UI
// function updateUI(user) {
//   const isSignedIn = !!user && !user.isAnonymous;
//   if (isSignedIn) {
//     currentUser = user;
//     userIdEl.textContent = user.displayName || user.email;
//     authBtn.textContent = "Sign Out";
//     authBtn.className = "bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700";
//   } else {
//     currentUser = null;
//     userIdEl.textContent = "Guest";
//     authBtn.textContent = "Sign In with Google";
//     authBtn.className = "bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700";
//   }
// }

function updateUI(user) {
  const isSignedIn = !!user && !user.isAnonymous;
  if (isSignedIn) {
    currentUser = user;
    userIdEl.textContent = user.displayName || user.email;
    authBtn.querySelector(".gsi-material-button-contents").textContent = "Sign Out";
    authBtn.classList.remove("blue");
    authBtn.classList.add("red");
  } else {
    currentUser = null;
    userIdEl.textContent = "Guest";
    authBtn.querySelector(".gsi-material-button-contents").textContent = "Sign in with Google";
    authBtn.classList.remove("red");
    authBtn.classList.add("blue");
  }
}


// ✅ Sign in/out logic
authBtn.addEventListener("click", async () => {
  try {
    if (currentUser) {
      await signOut(auth);
      showNotification("Signed out successfully", "success");
    } else {
      await signInWithPopup(auth, provider);
      showNotification("Signed in successfully", "success");
    }
  } catch (error) {
    console.error("Authentication error:", error);
    showNotification("Sign-in failed.", "error");
  }
});

// ✅ Track user state
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // Optional: fallback to anonymous sign-in
    signInAnonymously(auth).catch((e) => console.error("Anonymous failed:", e));
  }
  updateUI(user);
});
