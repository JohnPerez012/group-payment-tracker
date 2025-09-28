// Initialize AOS animations
AOS.init({
  duration: 1000,
  once: true, // animation happens only once
});

// Example placeholder for handling form submit
document.querySelector(".search-form").addEventListener("submit", function(e) {
  e.preventDefault();
  alert("Searching for Student ID... (demo only)");
});

const header = document.querySelector(".header");

window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

// Reveal on scroll
function revealOnScroll() {
  const reveals = document.querySelectorAll(".reveal");
  reveals.forEach(el => {
    const windowHeight = window.innerHeight;
    const elementTop = el.getBoundingClientRect().top;
    const elementVisible = 100;

    if (elementTop < windowHeight - elementVisible) {
      el.classList.add("active");
    }
  });
}

window.addEventListener("scroll", revealOnScroll);
