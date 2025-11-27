import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { initSearchModal } from './searchModal.js';

// ====================
// Initialize AOS animations
// ====================
AOS.init({
  duration: 800,
  once: true,
  offset: 100,
  easing: 'ease-out-cubic'
});

// ====================
// Header scroll effect
// ====================
const header = document.querySelector(".main-header");

window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

// ====================
// Smooth scrolling for nav links
// ====================
// const header = document.querySelector(".main-header");

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", e => {
    const targetID = anchor.getAttribute("href");

    // Ignore empty hashes
    if (targetID === "#" || !targetID.startsWith("#")) return;

    const target = document.querySelector(targetID);
    if (!target) return;

    e.preventDefault();

    const headerOffset = header ? header.offsetHeight : 0;
    const elementPosition = target.getBoundingClientRect().top + window.scrollY;

    const offsetPosition = elementPosition - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });
  });
});


// ====================
// Reveal on scroll animation
// ====================
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
// Initial check
revealOnScroll();

// ====================
// Dashboard Access Control
// ====================
document.addEventListener("DOMContentLoaded", () => {
  initSearchModal();


  const dashboardLink = document.querySelector('a[href="index.html"]');
  const modal = document.getElementById("signin-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const auth = getAuth();

  let isUserSignedIn = false;

  onAuthStateChanged(auth, (user) => {
    isUserSignedIn = !!user && !user.isAnonymous;
  });

  if (dashboardLink) {
    dashboardLink.addEventListener("click", (e) => {
      e.preventDefault(); // stop normal link behavior first

      if (!isUserSignedIn) {
        if (modal) modal.classList.remove("hidden");
      } else {
        window.location.href = "index.html";
      }
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      if (modal) modal.classList.add("hidden");
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.add("hidden");
      }
    });
  }
});


// ====================
// Console welcome message
// ====================
console.log('%cGPTracker', 'font-size: 25px; font-weight: bold; color: #1d4ed8;');
console.log('%cNO CODE PROVIDED,', 'font-size: 50px; font-weight: bold; color: #d81d1dff;');
console.log('%cSTOP HACKING!', 'font-size: 100px; font-weight: bold; color: #d81d1dff;');
console.log('%cTransparent Group Payment Tracking', 'font-size: 14px; color: #6b7280;');
console.log('%c© 2025 GPTracker', 'font-size: 12px; color: #9ca3af;');