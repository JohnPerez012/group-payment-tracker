// ====================
// Search Modal Functionality
// ====================

// Draggable and Maximize functionality
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;
let isMaximized = false;

const dragHandle = document.getElementById('dragHandle');
const restoreBtn = document.getElementById('restore-search-modal');
const modalWindow = document.querySelector('.modal-window');

const searchForm = document.getElementById("search-form");
const searchModal = document.getElementById("search-modal");
const closeSearchModal = document.getElementById("close-search-modal");
const closeSearchResults = document.getElementById("close-search-results");
const searchResultsContent = document.getElementById("search-results-content");

// Initialize search modal functionality
export function initSearchModal() {
  setupDragAndDrop();
  setupSearchForm();
  setupModalEvents();
}

function setupDragAndDrop() {
  if (dragHandle && modalWindow) {
    // Mouse events
    dragHandle.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    
    // Touch events for mobile
    dragHandle.addEventListener('touchstart', dragStart);
    document.addEventListener('touchmove', drag);
    document.addEventListener('touchend', dragEnd);
  }

  // Restore/Maximize functionality
  if (restoreBtn) {
    restoreBtn.addEventListener('click', toggleMaximize);
  }
}

function setupSearchForm() {
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = searchForm.querySelector('input[type="text"]');
      const inputWrapper = searchForm.querySelector('.search-input-wrapper');
      const searchValue = input.value.trim();
      
      // Remove any existing error states
      inputWrapper.classList.remove('shake', 'error');
      
      if (!searchValue) {
        // Show error state and shake animation
        showNotification('Please enter a UId to search', 'error');
        return;
      }
      
      // Valid search - open modal
      openSearchModal(searchValue);
    });
  }
}

function setupModalEvents() {
  // Close modal handlers
  if (closeSearchModal) {
    closeSearchModal.addEventListener("click", () => {
      searchModal.classList.add("hidden");
    });
  }

  if (closeSearchResults) {
    closeSearchResults.addEventListener("click", () => {
      searchModal.classList.add("hidden");
    });
  }

  // Close modal when clicking outside
  if (searchModal) {
    searchModal.addEventListener("click", (e) => {
      if (e.target === searchModal) {
        searchModal.classList.add("hidden");
      }
    });
  }

  // Close modal with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !searchModal.classList.contains("hidden")) {
      searchModal.classList.add("hidden");
    }
  });
}

function dragStart(e) {
  if (isMaximized) return;
  
  if (e.type === 'touchstart') {
    initialX = e.touches[0].clientX - xOffset;
    initialY = e.touches[0].clientY - yOffset;
  } else {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
  }
  
  if (e.target === dragHandle || dragHandle.contains(e.target)) {
    isDragging = true;
    modalWindow.style.transition = 'none';
  }
}

function drag(e) {
  if (isDragging && !isMaximized) {
    e.preventDefault();
    
    if (e.type === 'touchmove') {
      currentX = e.touches[0].clientX - initialX;
      currentY = e.touches[0].clientY - initialY;
    } else {
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
    }
    
    xOffset = currentX;
    yOffset = currentY;
    
    setTranslate(currentX, currentY, modalWindow);
  }
}

function dragEnd() {
  if (isDragging) {
    isDragging = false;
    modalWindow.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
  }
}

function setTranslate(xPos, yPos, el) {
  el.style.transform = `translate(${xPos}px, ${yPos}px)`;
}

function toggleMaximize() {
  const modalOverlay = document.querySelector('.modal-overlay:not(.hidden)');
  
  if (!isMaximized) {
    // Maximize
    modalWindow.classList.add('maximized');
    modalWindow.style.transform = 'none';
    modalWindow.style.width = '100vw';
    modalWindow.style.height = '100vh';
    modalWindow.style.borderRadius = '0';
    xOffset = 0;
    yOffset = 0;
    isMaximized = true;
    restoreBtn.innerHTML = '⧉'; // Change to restore icon
    restoreBtn.setAttribute('aria-label', 'Restore window');
  } else {
    // Restore
    modalWindow.classList.remove('maximized');
    modalWindow.style.width = 'min(85vw, calc(100vw - 4rem))';
    modalWindow.style.height = 'min(85vh, calc(100vh - 4rem))';
    modalWindow.style.borderRadius = '16px';
    modalWindow.style.transform = 'none';
    xOffset = 0;
    yOffset = 0;
    isMaximized = false;
    restoreBtn.innerHTML = '⎚'; // Change to maximize icon
    restoreBtn.setAttribute('aria-label', 'Maximize window');
    
    // Re-center the modal
    setTimeout(() => {
      modalWindow.style.transform = 'none';
    }, 10);
  }
}

// Reset position when modal is closed and reopened
function openSearchModal(searchValue) {
  // Reset modal position and state
  if (modalWindow) {
    modalWindow.style.transform = 'none';
    modalWindow.classList.remove('maximized');
    modalWindow.style.width = 'min(85vw, calc(100vw - 4rem))';
    modalWindow.style.height = 'min(85vh, calc(100vh - 4rem))';
    modalWindow.style.borderRadius = '16px';
    xOffset = 0;
    yOffset = 0;
    isMaximized = false;
    
    if (restoreBtn) {
      restoreBtn.innerHTML = '⎚';
      restoreBtn.setAttribute('aria-label', 'Maximize window');
    }
  }
  
  // Show loading state
  searchResultsContent.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 200px; flex-direction: column;">
      <div class="loading-spinner"></div>
      <p style="color: #6b7280; margin-top: 1rem; font-weight: 500;">Searching for: ${searchValue}</p>
    </div>
  `;
  
  // Show modal
  searchModal.classList.remove("hidden");
  
  // Simulate API call delay
  setTimeout(() => {
    displaySearchResults(searchValue);
  }, 1500);
}

// Function to display search results
function displaySearchResults(searchValue) {
  // Sample data - replace with actual API response
  const sampleData = {
    uid: searchValue,
    studentName: "Juan Dela Cruz",
    groupName: "Grade 10 - Section A",
    totalAmount: "₱2,500",
    paidAmount: "₱1,500",
    remainingAmount: "₱1,000",
    status: "Partially Paid",
    lastPayment: "2024-01-15",
    paymentHistory: [
      { date: "2024-01-15", amount: "₱500", type: "Monthly Fee", status: "Paid" },
      { date: "2024-01-10", amount: "₱1,000", type: "Activity Fee", status: "Paid" },
      { date: "2024-02-01", amount: "₱1,000", type: "Monthly Fee", status: "Pending" }
    ]
  };
  
  const resultsHTML = `
    <div class="payment-info">
      <h3>Payment Details for: ${sampleData.uid}</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Student Name</span>
          <span class="info-value">${sampleData.studentName}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Group</span>
          <span class="info-value">${sampleData.groupName}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Total Amount</span>
          <span class="info-value">${sampleData.totalAmount}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Paid Amount</span>
          <span class="info-value">${sampleData.paidAmount}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Remaining</span>
          <span class="info-value">${sampleData.remainingAmount}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Status</span>
          <span class="info-value" style="color: ${sampleData.status === 'Fully Paid' ? '#10b981' : sampleData.status === 'Partially Paid' ? '#f59e0b' : '#ef4444'}">${sampleData.status}</span>
        </div>
      </div>
    </div>
    
    <div class="payment-history">
      <h4>Payment History</h4>
      <table class="history-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount</th>
            <th>Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${sampleData.paymentHistory.map(payment => `
            <tr>
              <td>${payment.date}</td>
              <td>${payment.amount}</td>
              <td>${payment.type}</td>
              <td class="status-${payment.status.toLowerCase()}">${payment.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  searchResultsContent.innerHTML = resultsHTML;
}

// Export functions for external use
export { openSearchModal, displaySearchResults };   