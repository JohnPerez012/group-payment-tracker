import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// ===============================
// ✅ Firebase Config
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyClZuFFFxtiwJar_YLrC8-G4ZSC5kSJJdU",
  authDomain: "group-payment-tracker.firebaseapp.com",
  projectId: "group-payment-tracker",
  storageBucket: "group-payment-tracker.firebasestorage.app",
  messagingSenderId: "208078945785",
  appId: "1:208078945785:web:5164201a43e0bd37c8d128"
};

// ===============================
// ✅ Initialize Firebase
// ===============================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let currentUser = null;

// ===============================
// ✅ Elements
// ===============================
const authButtons = document.querySelectorAll("#auth-btn-header, #auth-btn-modal");
const userIdEl = document.getElementById("user-id");

// ===============================
// ✅ Utility: show notification
// ===============================
function showNotification(msg, type = "info") {
  const n = document.createElement("div");
  n.className = `fixed top-4 right-4 p-3 rounded text-white z-50 ${
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-blue-500"
  }`;
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 3000);
}

// ===============================
// ✅ Update UI based on user state
// ===============================
function updateUI(user) {
  const isSignedIn = !!user && !user.isAnonymous;
  currentUser = isSignedIn ? user : null;

  if (userIdEl) {
    userIdEl.textContent = isSignedIn
      ? user.displayName || user.email
      : "Guest";
  }

  authButtons.forEach((btn) => {
    const textEl = btn.querySelector(".gsi-material-button-contents");
    if (!textEl) return;

    if (isSignedIn) {
      textEl.textContent = "Sign Out";
      btn.classList.remove("blue");
      btn.classList.add("red");
    } else {
      textEl.textContent = "Sign in with Google";
      btn.classList.remove("red");
      btn.classList.add("blue");
    }
  });
}

// ===============================
// ✅ Sign in/out logic
// ===============================
authButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
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
});

// ===============================
// ✅ Track Auth State
// ===============================
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // Optional: fallback to anonymous
    signInAnonymously(auth).catch((e) =>
      console.error("Anonymous failed:", e)
    );
  }
  updateUI(user);
});
