// URL Parameter Handler for QR Code Auto-Search
// This handles the ?searchuid=<UID> parameter to automatically search and display results
//
// SUPPORTS BOTH URL FORMATS:
// ✅ https://group-payment-tracker.web.app/LandingPage.html?searchuid=1u4p2y5m3w2v3y71@GPT
// ✅ https://group-payment-tracker.web.app/LandingPage.html?searchuid=1u4p2y5m3w2v3y71%40GPT
// URLSearchParams automatically decodes %40 to @ so both work identically

document.addEventListener("DOMContentLoaded", () => {
  // Parse URL parameters (automatically decodes URL-encoded characters)
  const urlParams = new URLSearchParams(window.location.search);
  const searchUid = urlParams.get("searchuid");

  if (!searchUid) {
    return; // No search parameter, exit early
  }

  console.log("🔍 Auto-search triggered for UID:", searchUid);

  // Check if we're on the landing page (where search functionality exists)
  const searchForm = document.getElementById("search-form");
  
  if (!searchForm) {
    console.log("⚠️ Search form not found - not on landing page");
    return;
  }

  // Find the search input (it's inside the form but doesn't have an ID)
  const searchInput = searchForm.querySelector('input[type="text"]');
  const searchBtn = searchForm.querySelector('button[type="submit"]');
  
  if (!searchInput) {
    console.log("⚠️ Search input not found");
    return;
  }

  console.log("✅ Search form found, initiating auto-search...");
  
  // Wait for the page to fully load and animations to settle
  setTimeout(() => {
    // Scroll to search section
    const searchSection = document.getElementById("search") || searchForm.closest("section");
    if (searchSection) {
      searchSection.scrollIntoView({ behavior: "smooth", block: "center" });
      console.log("📜 Scrolled to search section");
    }

    // Fill in the search input
    searchInput.value = searchUid;
    console.log("📝 Filled search input with UID:", searchUid);

    // Trigger the search after a short delay to ensure scroll completes
    setTimeout(() => {
      console.log("🚀 Triggering search...");
      
      if (searchBtn) {
        searchBtn.click();
      } else {
        // If no button, trigger form submit
        const submitEvent = new Event("submit", { 
          cancelable: true, 
          bubbles: true 
        });
        searchForm.dispatchEvent(submitEvent);
      }

      // Clean up URL (remove the parameter) after a delay
      setTimeout(() => {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        console.log("🧹 Cleaned up URL");
      }, 1000);
    }, 800);
  }, 1500);
});
