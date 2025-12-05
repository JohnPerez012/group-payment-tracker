
// ====================
// Search Modal Functionality
// ====================

// Draggable and Maximize functionality

import { showNotification, initNotificationStyles } from './utils/notificationEngine.js';
initNotificationStyles();


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
// Current unsubscribe function for realtime listener
let currentSearchUnsubscribe = null;

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

function stopRealtimeListener() {
  if (currentSearchUnsubscribe && typeof currentSearchUnsubscribe === 'function') {
    try {
      currentSearchUnsubscribe();
    } catch (err) {
      console.warn('Error while unsubscribing realtime listener:', err);
    }
  }
  currentSearchUnsubscribe = null;
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
      stopRealtimeListener();
    });
  }

  if (closeSearchResults) {
    closeSearchResults.addEventListener("click", () => {
      searchModal.classList.add("hidden");
      currentSearchValue = ''; // Reset current search
      stopRealtimeListener();
    });
  }

  // Close modal when clicking outside
  if (searchModal) {
    searchModal.addEventListener("click", (e) => {
      if (e.target === searchModal) {
        searchModal.classList.add("hidden");
        currentSearchValue = ''; // Reset current search
        stopRealtimeListener();
      }
    });
  }

  // Close modal with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !searchModal.classList.contains("hidden")) {
      searchModal.classList.add("hidden");
      currentSearchValue = ''; // Reset current search
      stopRealtimeListener();
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
    // helper to escape HTML inserted into innerHTML
    const escapeHtml = (str) => {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };
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

    // Stop any previous realtime listener
    stopRealtimeListener();

    // Subscribe to realtime updates for this UID
    const mod = await import('./firebaseSearch.js');

    if (mod && typeof mod.subscribeToFirestoreByUID === 'function') {
      // Set a temporary loading state until first snapshot arrives
      let first = true;
      currentSearchUnsubscribe = mod.subscribeToFirestoreByUID(searchValue, (searchData) => {
        if (first) {
          first = false;
        }

        if (searchData) {
          renderSearchResults(searchData, searchValue);
        } else {
          showNoResults(searchValue);
        }
      }, (err) => {
        console.error('Realtime search error:', err);
        showSearchError(searchValue);
      });
    } else {
      // Fallback to one-time fetch if realtime not available
      const { searchFirestoreByUID } = mod;
      const searchData = await searchFirestoreByUID(searchValue);

      if (searchData) {
        renderSearchResults(searchData, searchValue);
      } else {
        showNoResults(searchValue);
      }
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

  // Helper to escape HTML inserted into innerHTML (defined before try block)
  const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  // Build creator/owner info block from docId pattern: ownerEmailTAB<tabName>--v<YYYYMMDDHH:MM>
  let creatorHTML = '';
  try {
    const docId = searchData.docId || '';
    if (docId && docId.includes('TAB')) {
      const parts = docId.split('TAB');
      const ownerEmail = parts[0] || searchData.user || '';
      const rest = parts[1] || '';
      // find timestamp after --v
      const vIndex = rest.indexOf('--v');
      let rawTs = '';
      if (vIndex !== -1) {
        rawTs = rest.slice(vIndex + 3); // e.g. 2025112713:24
      }

      // Parse rawTs into a Date and format to 12-hour with AM/PM
      let formattedTs = rawTs;
      if (rawTs && /\d{8}\d{2}:\d{2}/.test(rawTs)) {
        try {
          const year = parseInt(rawTs.slice(0,4), 10);
          const month = parseInt(rawTs.slice(4,6), 10) - 1; // zero-based
          const day = parseInt(rawTs.slice(6,8), 10);
          const hour = parseInt(rawTs.slice(8,10), 10);
          const minute = parseInt(rawTs.slice(11,13), 10);
          const d = new Date(year, month, day, hour, minute);
          const options = { year: 'numeric', month: 'short', day: 'numeric' };
          const datePart = d.toLocaleDateString(undefined, options);
          let hour12 = d.getHours() % 12;
          if (hour12 === 0) hour12 = 12;
          const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
          const minutePadded = String(d.getMinutes()).padStart(2, '0');
          formattedTs = `${datePart} ${hour12}:${minutePadded} ${ampm}`;
        } catch (err) {
          // leave formattedTs as rawTs on error
        }
      }

      const ownerEsc = escapeHtml(ownerEmail);
      const rawEsc = escapeHtml(rawTs || docId);
      const mailto = `mailto:${encodeURIComponent(ownerEmail)}`;
      
      // Get current user's email/name from page (user-id element)
      const userIdEl = document.getElementById('user-id');
      const currentUserName = userIdEl ? userIdEl.textContent.trim() : 'A Concerned User';
      
      // Build modern, professional email template with better formatting
      const emailSubject = `Group Payment Tracking - "${tabName}" on GPTracker`;
      const emailBody = `Hi ${ownerEsc},
I hope you're doing well!

I'm reaching out to you as ${currentUserName} regarding your payment tracking tab on GPTracker.

Tab Information:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tab Name: ${escapeHtml(tabName || 'Untitled Tab')}
Created by you on ${formattedTs}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

My Concern:
I wanted to bring the following matter to your attention:

[Please share your specific concern or feedback here]

Next Steps:
I believe this is important for maintaining transparency and accuracy in our group's payment tracking. I'd appreciate your prompt response and any insights you might have.

Thank you for your attention to this matter. Looking forward to your response!

Best regards,
${currentUserName}

---
📱 Sent via GPTracker - Transparent Group Payment Tracking  
🌐 Keep your group's finances organized and transparent!
➡️ Start your organized GPTracking here: https://group-payment-tracker.web.app/`;
      
      const gmailCompose = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(ownerEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

      creatorHTML = `
        <div class="search-creator-info" style="display:flex;gap:1rem;align-items:center;margin:0.75rem 0;padding:0.5rem 0;border-top:1px solid #eef2ff;border-bottom:1px solid #f3f4f6;flex-wrap:wrap;">
          <div style="font-size:0.9rem;color:#374151;">Creator:
            <a href="${gmailCompose}" target="_blank" rel="noopener noreferrer" title="✨ Click to compose a professional message with a template (opens Gmail)" style="color:#1d4ed8;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:6px;transition:all 0.2s ease;background:rgba(29,78,216,0.05);" onmouseover="this.style.background='rgba(29,78,216,0.1)'" onmouseout="this.style.background='rgba(29,78,216,0.05)'">
              <span>${ownerEsc}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
            </a>
          </div>
          <div style="font-size:0.9rem;color:#6b7280;">Created: <strong style="color:#111827;">${formattedTs}</strong></div>
          <div style="font-size:0.8rem;color:#9ca3af;">Raw: <code style="background:#f8fafc;padding:2px 6px;border-radius:4px">${rawEsc}</code></div>
        </div>
      `;
    }
  } catch (err) {
    console.warn('Failed to build creator info:', err);
    creatorHTML = '';
  }

  const resultsHTML = `
    <div class="search-result-header">
      <h3>Tab Name: <strong><span class="tab-name-inSRH">${tabName || 'Untitled Tab'} </span></strong></h3>
      <div class="search-result-meta">
        <span><strong>Payment Details for: </strong> ${searchValue}</span>
        <span><strong>Total Members:</strong> ${members.length}</span>
        <span><strong>Total Payments:</strong> ${payments.length}</span>
        <span><strong>Default Amount:</strong> ₱${tabDefaultAmount.toLocaleString()}</span>
      </div>
    </div>
    ${creatorHTML}

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

