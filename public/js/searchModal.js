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

// Track current search for refresh functionality
let currentSearchValue = '';

// Initialize search modal functionality
export function initSearchModal() {
  setupDragAndDrop();
  setupSearchForm();
  setupModalEvents();
  setupRefreshFunctionality();
}

function setupRefreshFunctionality() {
  const refreshLogo = document.getElementById('refresh-search-results');
  const refreshtext = document.getElementById('refresh-search-results-text');

  if (refreshLogo || refreshtext) {
    refreshLogo.addEventListener('click', refreshSearchResults);
  } 
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
      currentSearchValue = ''; // Reset current search
    });
  }

  if (closeSearchResults) {
    closeSearchResults.addEventListener("click", () => {
      searchModal.classList.add("hidden");
      currentSearchValue = ''; // Reset current search
    });
  }

  // Close modal when clicking outside
  if (searchModal) {
    searchModal.addEventListener("click", (e) => {
      if (e.target === searchModal) {
        searchModal.classList.add("hidden");
        currentSearchValue = ''; // Reset current search
      }
    });
  }

  // Close modal with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !searchModal.classList.contains("hidden")) {
      searchModal.classList.add("hidden");
      currentSearchValue = ''; // Reset current search
    }
  });
}

// Refresh search results functionality
async function refreshSearchResults() {
  if (!currentSearchValue) return;
  
  const refreshLogo = document.getElementById('refresh-search-results');
  
  // Add refreshing animation
  if (refreshLogo) {
    refreshLogo.classList.add('refreshing');
  }
  
  // Show refreshing state
  searchResultsContent.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 200px; flex-direction: column;">
      <div class="loading-spinner"></div>
      <p style="color: #6b7280; margin-top: 1rem; font-weight: 500;">Refreshing data for: ${currentSearchValue}</p>
    </div>
  `;
  
  try {
    // Re-fetch the data
    await displaySearchResults(currentSearchValue);
    showNotification('Search results refreshed', 'success');
  } catch (error) {
    console.error('Refresh error:', error);
    showNotification('Failed to refresh results', 'error');
  } finally {
    // Remove refreshing animation
    if (refreshLogo) {
      setTimeout(() => {
        refreshLogo.classList.remove('refreshing');
      }, 600);
    }
  }
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
  // Store the current search value for refresh functionality
  currentSearchValue = searchValue;

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

  // Start the actual search
  displaySearchResults(searchValue);
}

// Function to display search results
async function displaySearchResults(searchValue) {
  try {
    // Show loading state
    searchResultsContent.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 200px; flex-direction: column;">
        <div class="loading-spinner"></div>
        <p style="color: #6b7280; margin-top: 1rem; font-weight: 500;">Searching for: ${searchValue}</p>
      </div>
    `;

    // Search Firestore for the UID
    const { searchFirestoreByUID } = await import('./firebaseSearch.js');
    const searchData = await searchFirestoreByUID(searchValue);

    if (searchData) {
      renderSearchResults(searchData, searchValue);
    } else {
      showNoResults(searchValue);
    }
  } catch (error) {
    console.error('Search error:', error);
    showSearchError(searchValue);
  }
}

// Helper function to validate search data
function validateSearchData(decodedData) {
  if (!decodedData) return false;
  
  const { members, payments, quickInfo } = decodedData;
  
  // Check if we have at least some data
  const hasMembers = members && Array.isArray(members) && members.length > 0;
  const hasPayments = payments && Array.isArray(payments) && payments.length > 0;
  const hasQuickInfo = quickInfo && Array.isArray(quickInfo) && quickInfo.length > 0;
  
  return hasMembers || hasPayments || hasQuickInfo;
}

// Function to render search results
function renderSearchResults(searchData, searchValue) {
  const { tabName, uid, decodedData } = searchData;
  
  if (!decodedData || !validateSearchData(decodedData)) {
    showNoResults(searchValue);
    return;
  }

  const { members = [], payments = [], quickInfo = [], tabDefaultAmounts = {} } = decodedData;
  
  // Calculate summary statistics
  const totalRequired = members.reduce((sum, member) => {
    const requiredAmount = member.requiredAmount || tabDefaultAmounts[searchData.docId] || 1;
    return sum + requiredAmount;
  }, 0);
  
  const totalCollected = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalOutstanding = Math.max(0, totalRequired - totalCollected);

  // Get default amount for this tab
  const tabDefaultAmount = tabDefaultAmounts[searchData.docId] || 1;

  const resultsHTML = `
    <div class="search-result-header">
      <h3>Payment Details for: ${searchValue}</h3>
      <div class="search-result-meta">
        <span><strong>Tab Name:</strong> ${tabName || 'Untitled Tab'}</span>
        <span><strong>Total Members:</strong> ${members.length}</span>
        <span><strong>Total Payments:</strong> ${payments.length}</span>
        <span><strong>Default Amount:</strong> ₱${tabDefaultAmount.toLocaleString()}</span>
      </div>
    </div>

    <div class="payment-summary-cards">
      <div class="summary-card">
        <div class="summary-label">Total Required</div>
        <div class="summary-value">₱${totalRequired.toLocaleString()}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Total Collected</div>
        <div class="summary-value text-green-600">₱${totalCollected.toLocaleString()}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Outstanding</div>
        <div class="summary-value text-red-600">₱${totalOutstanding.toLocaleString()}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Completion</div>
        <div class="summary-value ${totalCollected >= totalRequired ? 'text-green-600' : 'text-yellow-600'}">
          ${totalRequired > 0 ? Math.round((totalCollected / totalRequired) * 100) : 0}%
        </div>
      </div>
    </div>

    ${members.length > 0 ? `
    <div class="payment-info">
      <h4>Member Progress (${members.length} members)</h4>
      <div class="info-grid">
        ${members.map(member => {
          const memberPayments = payments.filter(p => p.name === member.Name);
          const totalPaid = memberPayments.reduce((sum, p) => sum + p.amount, 0);
          const requiredAmount = member.requiredAmount || tabDefaultAmount;
          const progress = requiredAmount > 0 ? Math.min((totalPaid / requiredAmount) * 100, 100) : 0;
          const isPaid = totalPaid >= requiredAmount;
          const amountRemaining = Math.max(0, requiredAmount - totalPaid);
          
          let barColor = isPaid ? "bg-green-500" : progress > 0 ? "bg-blue-500" : "bg-gray-300";
          let statusIcon = isPaid ? "✅" : progress > 0 ? "🟡" : "⚪";
          
          return `
            <div class="info-item member-progress-item">
              <div class="member-header">
                <span class="member-name">${statusIcon} ${member.Name}</span>
                <span class="member-amount">${formatCurrency(totalPaid)} / ${formatCurrency(requiredAmount)}</span>
              </div>
              <div class="progress-bar-bg mb-2">
                <div class="progress-bar ${barColor}" style="width: ${progress}%">
                  ${progress > 10 ? `<span class="progress-percentage">${Math.round(progress)}%</span>` : ''}
                </div>
              </div>
              <div class="member-details">
                ${isPaid 
                  ? '<span class="status-badge paid">Fully Paid</span>'
                  : `<span class="status-badge pending">Need: ₱${amountRemaining.toLocaleString()}</span>`
                }
                ${member.requiredAmount ? '<span class="custom-amount-badge" title="Custom amount">⚙️</span>' : ''}
              </div>
              ${memberPayments.length > 0 ? `
                <div class="payment-count">
                  ${memberPayments.length} payment${memberPayments.length > 1 ? 's' : ''}
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
    ` : '<div class="no-data-message">No members found in this tab.</div>'}

    ${payments.length > 0 ? `
    <div class="payment-history">
      <h4>Payment History (${payments.length} records)</h4>
      <div class="table-container">
        <table class="history-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            ${payments.map(payment => {
              const date = new Date(payment.timestamp);
              return `
                <tr>
                  <td class="payment-member">${payment.name}</td>
                  <td class="payment-amount">${formatCurrency(payment.amount)}</td>
                  <td class="payment-date">${date.toLocaleDateString()}</td>
                  <td class="payment-time">${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
    ` : '<div class="no-data-message">No payment history available.</div>'}

    ${quickInfo && quickInfo.length > 0 ? `
    <div class="quick-info-section">
      <h4>Additional Information</h4>
      <div class="quick-info-grid">
        ${quickInfo
          .filter(info => info.label && info.value) // Filter out invalid items
          .map(info => {
            const isProtected = info.isProtected;
            const isDefaultAmount = info.label && info.label.includes('Default amount');
            
            return `
              <div class="quick-info-item ${isProtected ? 'protected-info' : ''} ${isDefaultAmount ? 'default-amount-info' : ''}">
                <div class="quick-info-header">
                  <span class="quick-info-label">${info.label}</span>
                  ${isProtected ? '<span class="protected-badge" title="Protected information">🔒</span>' : ''}
                </div>
                <span class="quick-info-value ${isDefaultAmount ? 'default-amount-value' : ''}">${info.value}</span>
              </div>
            `;
          }).join('')}
      </div>
    </div>
    ` : '<div class="no-data-message">No additional information available.</div>'}

    <div class="search-disclaimer">
      <p><strong>📋 Read-Only View:</strong> This is a display-only interface. No modifications can be made to this data.</p>
      <p class="disclaimer-note">Data last updated when the tab owner last saved their changes. Click the logo to refresh.</p>
    </div>
  `;
  
  searchResultsContent.innerHTML = resultsHTML;
}

// Helper function to format currency
function formatCurrency(amount) {
  return `₱${amount.toLocaleString()}`;
}

// Show no results message
function showNoResults(searchValue) {
  searchResultsContent.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 200px; flex-direction: column;">
      <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
      <h3 style="color: #6b7280; margin-bottom: 0.5rem;">No Results Found</h3>
      <p style="color: #9ca3af; text-align: center;">
        No payment data found for UID: <strong>${searchValue}</strong>
      </p>
      <p style="color: #9ca3af; font-size: 0.875rem; margin-top: 0.5rem;">
        Please check the UID and try again.
      </p>
    </div>
  `;
}

// Show search error message
function showSearchError(searchValue) {
  searchResultsContent.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 200px; flex-direction: column;">
      <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
      <h3 style="color: #ef4444; margin-bottom: 0.5rem;">Search Error</h3>
      <p style="color: #9ca3af; text-align: center;">
        An error occurred while searching for UID: <strong>${searchValue}</strong>
      </p>
      <p style="color: #9ca3af; font-size: 0.875rem; margin-top: 0.5rem;">
        Please try again later.
      </p>
    </div>
  `;
}

// Export functions for external use
export { openSearchModal, displaySearchResults };

// Notification function
function showNotification(msg, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
    type === 'error' ? 'bg-red-500 text-white' : 
    type === 'success' ? 'bg-green-500 text-white' : 
    'bg-blue-500 text-white'
  }`;
  notification.textContent = msg;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}