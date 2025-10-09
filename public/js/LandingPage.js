// import { onAuthStateChanged, getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";


// =============================
// Initialize AOS animations
// =============================
AOS.init({
  duration: 1000,
  once: true, // animation happens only once
});

// =============================
// Search form (demo only)
// =============================
const searchForm = document.querySelector(".search-form");
if (searchForm) {
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Future Feature... (demo only)");
  });
}

// =============================
// Header scroll effect
// =============================
const header = document.querySelector(".main-header");

window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

// =============================
// Reveal on scroll
// =============================
function revealOnScroll() {
  const reveals = document.querySelectorAll(".reveal");
  const windowHeight = window.innerHeight;

  reveals.forEach((el) => {
    const elementTop = el.getBoundingClientRect().top;
    const elementVisible = 100;

    if (elementTop < windowHeight - elementVisible) {
      el.classList.add("active");
    }
  });
}

window.addEventListener("scroll", revealOnScroll);

// =============================
// Smooth scrolling for nav links
// =============================
document.querySelectorAll('header nav a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    e.preventDefault();

    const targetID = anchor.getAttribute("href");
    const target = document.querySelector(targetID);

    if (!target) return;

    const headerOffset = header ? header.offsetHeight : 0;
    const targetPosition = target.offsetTop;
    const offsetPosition = targetPosition - headerOffset + 10;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  });
});




// =============================
// Dashboard Access Control
// =============================
document.addEventListener("DOMContentLoaded", () => {
  const dashboardLink = document.querySelector('a[href="index.html"]');
  const modal = document.getElementById("signin-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");

  const auth = getAuth();
  let isUserSignedIn = false;

  // ✅ Track Firebase Auth state
  onAuthStateChanged(auth, (user) => {
    isUserSignedIn = !!user && !user.isAnonymous;
  });

  // ✅ Handle click on Dashboard
  if (dashboardLink) {
    dashboardLink.addEventListener("click", (e) => {
      e.preventDefault(); // stop normal link behavior first

      if (!isUserSignedIn) {
        // ❌ Not logged in → show modal
        if (modal) modal.classList.remove("hidden");
      } else {
        // ✅ Logged in → go directly to Dashboard
        window.location.href = "index.html";
      }
    });
  }

  // ✅ Close modal button
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      if (modal) modal.classList.add("hidden");
    });
  }
});