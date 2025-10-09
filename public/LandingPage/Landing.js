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
    alert("Searching for Student ID... (demo only)");
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
  const dashboardLink = document.querySelector('a[href="../index.html"]');
  const modal = document.getElementById("signin-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");

  // Example: change this check to match your real login state
  const isUserSignedIn = localStorage.getItem("user") !== null;

  if (dashboardLink) {
    dashboardLink.addEventListener("click", (e) => {
      if (!isUserSignedIn) {
        e.preventDefault(); // stop redirect
        if (modal) modal.classList.remove("hidden");
      }
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      if (modal) modal.classList.add("hidden");
    });
  }
});

