import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";


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
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    e.preventDefault();

    const targetID = anchor.getAttribute("href");
    if (targetID === "#") return;
    
    const target = document.querySelector(targetID);
    if (!target) return;

    const headerOffset = header ? header.offsetHeight : 0;
    const targetPosition = target.offsetTop;
    const offsetPosition = targetPosition - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  });
});

// ====================
// Search form handler
// ====================
const searchForm = document.getElementById("search-form");
if (searchForm) {
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = searchForm.querySelector('input[type="text"]');
    const searchValue = input.value.trim();
    
    if (searchValue) {
      // Create a nice alert with the search value
      showNotification(`Searching for: ${searchValue}`, 'info');
      // You can replace this with actual search functionality
      console.log("Search query:", searchValue);
    }
  });
}

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
// Dashboard Access Control & Modal
// ====================
document.addEventListener("DOMContentLoaded", () => {
  const dashboardLink = document.querySelector('.nav-link-dashboard');
  const modal = document.getElementById("signin-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const authBtnHeader = document.getElementById("auth-btn-header");
  const authBtnModal = document.getElementById("auth-btn-modal");
  const userIdDisplay = document.getElementById("user-id");

  // Track if user is signed in (for demo purposes, this is false by default)
  let isUserSignedIn = false;
  let currentUser = null;

  // Function to update UI based on auth state
  function updateAuthUI() {
    if (isUserSignedIn && currentUser) {
      userIdDisplay.textContent = currentUser.displayName || currentUser.email || "Signed In";
      if (authBtnHeader) {
        authBtnHeader.querySelector('.gsi-material-button-contents').textContent = 'Sign Out';
      }
    } else {
      userIdDisplay.textContent = "Not signed in";
      if (authBtnHeader) {
        authBtnHeader.querySelector('.gsi-material-button-contents').textContent = 'Sign in with Google';
      }
    }
  }

  // Handle Dashboard link click
  if (dashboardLink) {
    dashboardLink.addEventListener("click", (e) => {
      e.preventDefault();

      if (!isUserSignedIn) {
        // Show modal if not signed in
        if (modal) {
          modal.classList.remove("hidden");
        }
      } else {
        // Navigate to dashboard (you can change this URL)
        showNotification("Navigating to Dashboard...", "success");
        // window.location.href = "dashboard.html";
      }
    });
  }

  // Close modal button
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      if (modal) {
        modal.classList.add("hidden");
      }
    });
  }

  // Close modal when clicking outside
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.add("hidden");
      }
    });
  }

  // Initialize UI
  updateAuthUI();
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

// ====================
// Mobile Menu Toggle
// ====================
const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
const navCenter = document.querySelector(".nav-center");

if (mobileMenuToggle && navCenter) {
  mobileMenuToggle.addEventListener("click", () => {
    navCenter.classList.toggle("active");
    mobileMenuToggle.classList.toggle("active");
  });
}

// ====================
// Custom Notification System
// ====================
function showNotification(message, type = 'info') {
  // Remove existing notification if any
  const existing = document.querySelector('.custom-notification');
  if (existing) {
    existing.remove();
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `custom-notification ${type}`;
  notification.textContent = message;
  
  // Add styles
  Object.assign(notification.style, {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    padding: '1rem 1.5rem',
    background: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6',
    color: 'white',
    borderRadius: '0.75rem',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    zIndex: '9999',
    fontWeight: '500',
    fontSize: '0.95rem',
    animation: 'slideInUp 0.3s ease',
    maxWidth: '300px'
  });

  document.body.appendChild(notification);

  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOutDown 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutDown {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(100%);
      opacity: 0;
    }
  }
  
  .nav-center.active {
    display: flex !important;
    flex-direction: column;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(12px);
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    gap: 1rem;
  }
  
  .mobile-menu-toggle.active span:nth-child(1) {
    transform: rotate(45deg) translate(7px, 7px);
  }
  
  .mobile-menu-toggle.active span:nth-child(2) {
    opacity: 0;
  }
  
  .mobile-menu-toggle.active span:nth-child(3) {
    transform: rotate(-45deg) translate(7px, -7px);
  }
`;
document.head.appendChild(style);

// ====================
// Console welcome message
// ====================
console.log('%cGPTracker', 'font-size: 25px; font-weight: bold; color: #1d4ed8;');
console.log('%cNO CODE PROVIDED,', 'font-size: 50px; font-weight: bold; color: #d81d1dff;');
console.log('%cSTOP HACKING!', 'font-size: 100px; font-weight: bold; color: #d81d1dff;');
console.log('%cTransparent Group Payment Tracking', 'font-size: 14px; color: #6b7280;');
console.log('%c© 2025 GPTracker', 'font-size: 12px; color: #9ca3af;');
