
// ====================
// Search Modal Functionality
// ====================

// Draggable and Maximize functionality

import { showNotification, initNotificationStyles } from './utils/notificationEngine.js';
import { exportSearchResultsToPDF } from './utils/pdfExport.js';
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
// Store current search data for export
let currentSearchData = null;

// Initialize search modal functionality
export function initSearchModal() {
  setupDragAndDrop();
  setupSearchForm();
  setupModalEvents();
  setupRefreshFunctionality();
  setupExportFunctionality();
}






function setupRefreshFunctionality() {
  const refreshLogo = document.getElementById('refresh-search-results');
  const refreshtext = document.getElementById('refresh-search-results-text');

  if (refreshLogo || refreshtext) {
    refreshLogo.addEventListener('click', refreshSearchResults);
  } 
}

// Flag to track if we should auto-export after login
let pendingExport = false;

function setupExportFunctionality() {
  const exportBtn = document.getElementById('export-results');
  
  if (exportBtn) {
    // Check if user is logged in
    updateExportButtonState(exportBtn);
    
    // Listen for auth state changes to auto-export after login
    setupAuthStateListener();
    
    exportBtn.addEventListener('click', () => {
      // Get current user info
      const userIdElement = document.getElementById('user-id');
      const currentUser = userIdElement ? userIdElement.textContent.trim() : null;
      
      if (!currentUser || currentUser === 'Guest' || currentUser === 'Loading...') {
        // User not logged in - trigger sign-in flow
        triggerSignInForExport();
        return;
      }
      
      // User logged in - export directly
      performExport(currentUser);
    });
  }
}

// Trigger sign-in and set flag for auto-export
function triggerSignInForExport() {
  // Set flag to auto-export after successful login
  pendingExport = true;
  
  // Show notification with sign-in prompt
  showNotification('Redirecting to sign in...', 'info');
  
  // Find and click the auth button to trigger Google sign-in
  const authBtn = document.querySelector('#auth-btn-header, #auth-btn-modal');
  if (authBtn) {
    // Small delay to show the notification
    setTimeout(() => {
      authBtn.click();
    }, 500);
  } else {
    showNotification('Sign-in button not found. Please sign in manually.', 'error');
    pendingExport = false;
  }
}

// Setup listener for auth state changes
function setupAuthStateListener() {
  // Import Firebase auth if available
  import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js')
    .then(({ getAuth, onAuthStateChanged }) => {
      const auth = getAuth();
      
      onAuthStateChanged(auth, (user) => {
        const exportBtn = document.getElementById('export-results');
        
        // Update button state
        updateExportButtonState(exportBtn);
        
        // If user just signed in and we have a pending export
        if (user && !user.isAnonymous && pendingExport) {
          pendingExport = false; // Reset flag
          
          // Get user info
          const userName = user.displayName || user.email;
          
          // Auto-export after successful login
          setTimeout(() => {
            showNotification('Sign-in successful! Exporting PDF...', 'success');
            performExport(userName);
          }, 1000);
        } else if (!user || user.isAnonymous) {
          // User signed out or canceled - reset flag
          if (pendingExport) {
            pendingExport = false;
            showNotification('Sign-in canceled. Export not completed.', 'info');
          }
        }
      });
    })
    .catch(err => {
      console.warn('Could not setup auth listener:', err);
    });
}

// Perform the actual export
function performExport(userName) {
  if (!currentSearchData || !currentSearchValue) {
    showNotification('No data available to export', 'error');
    return;
  }
  
  exportSearchResultsToPDF(currentSearchData, currentSearchValue, userName);
}

// Update export button state based on user login
function updateExportButtonState(exportBtn) {
  if (!exportBtn) return;
  
  const userIdElement = document.getElementById('user-id');
  const currentUser = userIdElement ? userIdElement.textContent.trim() : null;
  
  if (!currentUser || currentUser === 'Guest' || currentUser === 'Loading...') {
    // User not logged in - show sign-in button
    exportBtn.disabled = false; // Keep enabled so it's clickable
    exportBtn.classList.add('export-signin-required');
    exportBtn.title = '🔒 Click to sign in and export data';
    exportBtn.innerHTML = '🔒 Sign In & Export';
  } else {
    // User logged in - show export button
    exportBtn.disabled = false;
    exportBtn.classList.remove('export-signin-required');
    exportBtn.title = 'Export search results as PDF';
    exportBtn.innerHTML = 'Export Results';
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
  // Store current search data for export
  currentSearchData = searchData;
  
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
            <a href="${gmailCompose}" target="_blank" rel="noopener noreferrer" title="Click to compose a professional message with a template (opens Gmail)" style="color:#1d4ed8;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:6px;transition:all 0.2s ease;background:rgba(29,78,216,0.05);" onmouseover="this.style.background='rgba(29,78,216,0.1)'" onmouseout="this.style.background='rgba(29,78,216,0.05)'">
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
    <div class="modal-search-bar">
      <form id="modal-search-form" class="modal-search-form">
        <div class="modal-search-input-wrapper">
          <svg
            class="modal-search-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            id="modal-search-input"
            placeholder="Search by UID or member name..."
            value="${searchValue}"
          />
          <button type="button" id="clear-smart-search" class="clear-search-btn" style="display: none;">✕</button>
        </div>
        <button type="submit" class="modal-search-button">Search</button>
      </form>
      <div id="smart-search-hint" class="smart-search-hint"></div>
      <div id="smart-search-results" class="search-results-info"></div>
    </div>

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
      <div class="info-grid" id="members-grid">
        ${members.map((member, index) => {
          const memberPayments = payments.filter(p => p.name === member.Name);
          const totalPaid = memberPayments.reduce((sum, p) => sum + p.amount, 0);
          const requiredAmount = member.requiredAmount || tabDefaultAmount;
          const progress = requiredAmount > 0 ? Math.min((totalPaid / requiredAmount) * 100, 100) : 0;
          const isPaid = totalPaid >= requiredAmount;
          const amountRemaining = Math.max(0, requiredAmount - totalPaid);
          
          let barColor = isPaid ? "bg-green-500" : progress > 0 ? "bg-blue-500" : "bg-gray-300";
          let statusIcon = isPaid ? "✅" : progress > 0 ? "🟡" : "⚪";
          
          return `
            <div class="info-item member-progress-item" data-member-name="${escapeHtml(member.Name.toLowerCase())}" data-member-index="${index}">
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
              <th class="sortable" data-sort="member">
                Member
                <span class="sort-icon">⇅</span>
              </th>
              <th class="sortable" data-sort="amount">
                Amount
                <span class="sort-icon">⇅</span>
              </th>
              <th class="sortable" data-sort="date">
                Date
                <span class="sort-icon">⇅</span>
              </th>
              <th class="sortable" data-sort="time">
                Time
                <span class="sort-icon">⇅</span>
              </th>
            </tr>
          </thead>
          <tbody id="payments-tbody">
            ${payments.map((payment, index) => {
              const date = new Date(payment.timestamp);
              return `
                <tr data-payment-name="${escapeHtml(payment.name.toLowerCase())}" 
                    data-payment-index="${index}"
                    data-member="${escapeHtml(payment.name)}"
                    data-amount="${payment.amount}"
                    data-timestamp="${payment.timestamp}">
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
  
  // Setup smart search handler
  setupSmartSearchHandler();
  
  // Setup table sorting
  setupTableSorting();
}

// Smart search handler - detects UID vs Name
function setupSmartSearchHandler() {
  const searchInput = document.getElementById('modal-search-input');
  const searchForm = document.getElementById('modal-search-form');
  const clearBtn = document.getElementById('clear-smart-search');
  const hintElement = document.getElementById('smart-search-hint');
  const resultsElement = document.getElementById('smart-search-results');
  
  let searchTimeout;
  
  if (!searchInput || !searchForm) return;
  
  // Real-time search as user types
  searchInput.addEventListener('input', (e) => {
    const searchValue = e.target.value.trim();
    
    // Show/hide clear button
    if (clearBtn) {
      clearBtn.style.display = searchValue ? 'flex' : 'none';
    }
    
    // Debounce search
    clearTimeout(searchTimeout);
    
    if (!searchValue) {
      resetSearch(hintElement, resultsElement);
      return;
    }
    
    searchTimeout = setTimeout(() => {
      performSmartSearch(searchValue, hintElement, resultsElement, false); // false = don't scroll
    }, 300);
  });
  
  // Form submission for UID search or name search with scrolling
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const searchValue = searchInput.value.trim();
    
    if (!searchValue) {
      showNotification('Please enter a search term', 'error');
      return;
    }
    
    // Check if it looks like a UID
    if (isLikelyUID(searchValue)) {
      // Update current search value and perform new UID search
      currentSearchValue = searchValue;
      displaySearchResults(searchValue);
    } else {
      // Perform name search WITH scrolling (button clicked)
      performSmartSearch(searchValue, hintElement, resultsElement, true); // true = scroll to results
    }
  });
  
  // Clear button
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.style.display = 'none';
      resetSearch(hintElement, resultsElement);
    });
  }
}

// Detect if search term is likely a UID
function isLikelyUID(searchTerm) {
  // UID patterns: contains @GPT, or is long alphanumeric (16+ chars), or has specific patterns
  const uidPatterns = [
    /@GPT/i,                           // Contains @GPT
    /^[a-zA-Z0-9]{16,}$/,              // Long alphanumeric string (16+ chars)
    /^\d{10,}@/,                       // Starts with many digits followed by @
    /^[a-f0-9]{8}-[a-f0-9]{4}-/i       // UUID-like pattern
  ];
  
  return uidPatterns.some(pattern => pattern.test(searchTerm));
}

// Perform smart search - searches both members and payments
function performSmartSearch(searchTerm, hintElement, resultsElement, shouldScroll = false) {
  const searchLower = searchTerm.toLowerCase();
  
  // Determine search type
  const isUID = isLikelyUID(searchTerm);
  
  if (isUID) {
    // Show hint that this looks like a UID
    if (hintElement) {
      hintElement.innerHTML = `<span class="hint-uid">🔍 This looks like a UID. Press Enter to search for this tab.</span>`;
      hintElement.style.display = 'block';
    }
    if (resultsElement) {
      resultsElement.style.display = 'none';
    }
    return;
  }
  
  // It's a name search - search in current results
  if (hintElement) {
    hintElement.innerHTML = `<span class="hint-name">👤 Searching for "${searchTerm}" in current results...</span>`;
    hintElement.style.display = 'block';
  }
  
  // Search members
  const memberMatches = searchInMembers(searchLower);
  
  // Search payments
  const paymentMatches = searchInPayments(searchLower);
  
  // Display results
  displaySmartSearchResults(searchTerm, memberMatches, paymentMatches, resultsElement, shouldScroll);
}

// Search in members list
function searchInMembers(searchTerm) {
  const membersGrid = document.getElementById('members-grid');
  if (!membersGrid) return [];
  
  const memberItems = membersGrid.querySelectorAll('.member-progress-item');
  const matches = [];
  
  memberItems.forEach((item) => {
    const memberName = item.getAttribute('data-member-name') || '';
    
    if (memberName.includes(searchTerm)) {
      item.style.display = '';
      item.classList.remove('search-highlight');
      matches.push(item);
    } else {
      item.style.display = 'none';
    }
  });
  
  return matches;
}

// Search in payments list
function searchInPayments(searchTerm) {
  const paymentsTbody = document.getElementById('payments-tbody');
  if (!paymentsTbody) return [];
  
  const paymentRows = paymentsTbody.querySelectorAll('tr');
  const matches = [];
  
  paymentRows.forEach((row) => {
    const paymentName = row.getAttribute('data-payment-name') || '';
    
    if (paymentName.includes(searchTerm)) {
      row.style.display = '';
      row.classList.remove('search-highlight');
      matches.push(row);
    } else {
      row.style.display = 'none';
    }
  });
  
  return matches;
}

// Display smart search results
function displaySmartSearchResults(searchTerm, memberMatches, paymentMatches, resultsElement, shouldScroll = false) {
  if (!resultsElement) return;
  
  const totalMatches = memberMatches.length + paymentMatches.length;
  
  if (totalMatches === 0) {
    resultsElement.innerHTML = `<span class="search-error">✗ No results found for "${searchTerm}"</span>`;
    resultsElement.style.display = 'block';
    hideFloatingArrow();
    return;
  }
  
  // Build results message
  let message = '<span class="search-success">✓ Found: ';
  const parts = [];
  
  if (memberMatches.length > 0) {
    parts.push(`${memberMatches.length} member${memberMatches.length > 1 ? 's' : ''}`);
  }
  
  if (paymentMatches.length > 0) {
    parts.push(`${paymentMatches.length} payment${paymentMatches.length > 1 ? 's' : ''}`);
  }
  
  message += parts.join(' and ') + '</span>';
  resultsElement.innerHTML = message;
  resultsElement.style.display = 'block';
  
  // Highlight all matches (both members and payments)
  memberMatches.forEach(match => match.classList.add('search-highlight'));
  paymentMatches.forEach(match => match.classList.add('search-highlight'));
  
  // Only scroll and show arrow if shouldScroll is true (button clicked)
  if (shouldScroll) {
    // Smart scrolling logic
    if (memberMatches.length > 0) {
      // Scroll to first member match
      setTimeout(() => {
        smoothScrollToElement(memberMatches[0]);
      }, 100);
      
      // Show floating arrow if there are also payment matches below
      if (paymentMatches.length > 0) {
        showFloatingArrow(paymentMatches[0]);
      } else {
        hideFloatingArrow();
      }
    } else if (paymentMatches.length > 0) {
      // Only payment matches, scroll directly to first payment
      setTimeout(() => {
        smoothScrollToElement(paymentMatches[0]);
      }, 100);
      hideFloatingArrow();
    }
  } else {
    // Just filtering, no scrolling - but setup arrow if conditions are met
    if (memberMatches.length > 0 && paymentMatches.length > 0) {
      // Setup arrow but don't scroll yet
      showFloatingArrow(paymentMatches[0]);
    } else {
      hideFloatingArrow();
    }
  }
}

// Reset search - show all items
function resetSearch(hintElement, resultsElement) {
  // Show all members
  const membersGrid = document.getElementById('members-grid');
  if (membersGrid) {
    const memberItems = membersGrid.querySelectorAll('.member-progress-item');
    memberItems.forEach((item) => {
      item.style.display = '';
      item.classList.remove('search-highlight');
    });
  }
  
  // Show all payments
  const paymentsTbody = document.getElementById('payments-tbody');
  if (paymentsTbody) {
    const paymentRows = paymentsTbody.querySelectorAll('tr');
    paymentRows.forEach((row) => {
      row.style.display = '';
      row.classList.remove('search-highlight');
    });
  }
  
  // Clear hints and results
  if (hintElement) {
    hintElement.style.display = 'none';
  }
  if (resultsElement) {
    resultsElement.style.display = 'none';
  }
  
  // Hide floating arrow
  hideFloatingArrow();
}

// Show floating arrow button with viewport detection
function showFloatingArrow(targetElement) {
  // Remove existing arrow if any
  let arrow = document.getElementById('floating-payment-arrow');
  
  if (!arrow) {
    // Create floating arrow
    arrow = document.createElement('button');
    arrow.id = 'floating-payment-arrow';
    arrow.className = 'floating-payment-arrow';
    arrow.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 5v14M19 12l-7 7-7-7"/>
      </svg>
      <span class="arrow-tooltip">Payment records below</span>
    `;
    
    // Add to modal body
    const modalBody = document.querySelector('.modal-body');
    if (modalBody) {
      modalBody.appendChild(arrow);
    }
    
    // Setup viewport detection
    setupArrowViewportDetection(arrow, targetElement);
  }
  
  // Store target element reference (update even if arrow exists)
  arrow.targetElement = targetElement;
  
  // Remove old click handler if exists
  if (arrow.clickHandler) {
    arrow.removeEventListener('click', arrow.clickHandler);
  }
  
  // Create and store new click handler
  arrow.clickHandler = () => {
    if (arrow.targetElement) {
      smoothScrollToElement(arrow.targetElement);
      // Temporarily hide arrow after clicking
      arrow.classList.remove('visible');
    }
  };
  
  // Add click handler
  arrow.addEventListener('click', arrow.clickHandler);
  
  // Check initial visibility
  checkArrowVisibility(arrow);
}

// Setup viewport detection for floating arrow
function setupArrowViewportDetection(arrow, targetElement) {
  const modalBody = document.querySelector('.modal-body');
  if (!modalBody) return;
  
  // Store target element reference
  arrow.dataset.targetElement = 'payment-section';
  
  // Remove existing scroll listener if any
  if (modalBody.arrowScrollListener) {
    modalBody.removeEventListener('scroll', modalBody.arrowScrollListener);
  }
  
  // Create scroll listener
  const scrollListener = () => {
    checkArrowVisibility(arrow);
  };
  
  // Store reference for cleanup
  modalBody.arrowScrollListener = scrollListener;
  
  // Add scroll listener
  modalBody.addEventListener('scroll', scrollListener);
}

// Check if arrow should be visible based on viewport
function checkArrowVisibility(arrow) {
  if (!arrow) return;
  
  const modalBody = document.querySelector('.modal-body');
  const paymentInfo = document.querySelector('.payment-info');
  const paymentHistory = document.querySelector('.payment-history');
  
  if (!modalBody || !paymentInfo || !paymentHistory) return;
  
  // Get viewport boundaries
  const modalRect = modalBody.getBoundingClientRect();
  const paymentInfoRect = paymentInfo.getBoundingClientRect();
  const paymentHistoryRect = paymentHistory.getBoundingClientRect();
  
  // Check if user is viewing payment-info section (member progress)
  // Member progress is visible if any part of it is in viewport
  const isViewingMemberProgress = paymentInfoRect.top < modalRect.bottom && 
                                   paymentInfoRect.bottom > modalRect.top;
  
  // Check if payment history is mostly below viewport or not fully visible
  // Show arrow if payment history top is below 70% of viewport height
  const viewportThreshold = modalRect.top + (modalRect.height * 0.7);
  const isPaymentHistoryMostlyBelow = paymentHistoryRect.top > viewportThreshold;
  
  // Alternative: Check if payment history is not fully visible in viewport
  const isPaymentHistoryNotFullyVisible = 
    paymentHistoryRect.bottom > modalRect.bottom || 
    paymentHistoryRect.top > modalRect.bottom - 100; // 100px buffer
  
  // Show arrow if:
  // 1. User is viewing member progress section
  // 2. AND payment history is mostly below or not fully visible
  if (isViewingMemberProgress && (isPaymentHistoryMostlyBelow || isPaymentHistoryNotFullyVisible)) {
    arrow.classList.add('visible');
  } else {
    arrow.classList.remove('visible');
  }
}

// Hide floating arrow button
function hideFloatingArrow() {
  const arrow = document.getElementById('floating-payment-arrow');
  const modalBody = document.querySelector('.modal-body');
  
  if (arrow) {
    arrow.classList.remove('visible');
    setTimeout(() => {
      arrow.remove();
    }, 300);
  }
  
  // Remove scroll listener
  if (modalBody && modalBody.arrowScrollListener) {
    modalBody.removeEventListener('scroll', modalBody.arrowScrollListener);
    modalBody.arrowScrollListener = null;
  }
}



// Smooth scroll to element with direction-aware animation
function smoothScrollToElement(element) {
  if (!element) return;
  
  const modalBody = document.querySelector('.modal-body');
  if (!modalBody) return;
  
  const elementRect = element.getBoundingClientRect();
  const modalRect = modalBody.getBoundingClientRect();
  const elementTop = elementRect.top - modalRect.top + modalBody.scrollTop;
  
  // Calculate if scrolling up or down
  const currentScroll = modalBody.scrollTop;
  const targetScroll = elementTop - 230; // 100px offset from top
  const scrollingDown = targetScroll > currentScroll;
  
  // Add animation class based on direction
  element.classList.add(scrollingDown ? 'scroll-reveal-down' : 'scroll-reveal-up');
  
  // Smooth scroll
  modalBody.scrollTo({
    top: targetScroll,
    behavior: 'smooth'
  });
  
  // Remove animation class after animation completes
  setTimeout(() => {
    element.classList.remove('scroll-reveal-down', 'scroll-reveal-up');
  }, 800);
}

// Helper function to format currency
function formatCurrency(amount) {
  return `₱${amount.toLocaleString()}`;
}

// Setup table sorting functionality
function setupTableSorting() {
  const sortableHeaders = document.querySelectorAll('.history-table th.sortable');
  
  sortableHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const sortType = header.getAttribute('data-sort');
      const currentOrder = header.getAttribute('data-order') || 'none';
      
      // Determine new sort order
      let newOrder;
      if (currentOrder === 'none' || currentOrder === 'desc') {
        newOrder = 'asc'; // First click or after desc -> ascending
      } else {
        newOrder = 'desc'; // After asc -> descending
      }
      
      // Remove sort indicators from all headers
      sortableHeaders.forEach(h => {
        h.setAttribute('data-order', 'none');
        const icon = h.querySelector('.sort-icon');
        if (icon) icon.textContent = '⇅';
      });
      
      // Set new sort order
      header.setAttribute('data-order', newOrder);
      const icon = header.querySelector('.sort-icon');
      if (icon) {
        icon.textContent = newOrder === 'asc' ? '↑' : '↓';
      }
      
      // Perform sort
      sortTable(sortType, newOrder);
    });
  });
}

// Sort table by column
function sortTable(sortType, order) {
  const tbody = document.getElementById('payments-tbody');
  if (!tbody) return;
  
  const rows = Array.from(tbody.querySelectorAll('tr'));
  
  // Sort rows
  rows.sort((a, b) => {
    let aValue, bValue;
    
    switch (sortType) {
      case 'member':
        aValue = a.getAttribute('data-member').toLowerCase();
        bValue = b.getAttribute('data-member').toLowerCase();
        return order === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      
      case 'amount':
        aValue = parseFloat(a.getAttribute('data-amount'));
        bValue = parseFloat(b.getAttribute('data-amount'));
        return order === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      
      case 'date':
      case 'time':
        aValue = parseInt(a.getAttribute('data-timestamp'));
        bValue = parseInt(b.getAttribute('data-timestamp'));
        return order === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      
      default:
        return 0;
    }
  });
  
  // Clear tbody
  tbody.innerHTML = '';
  
  // Append sorted rows with animation
  rows.forEach((row, index) => {
    row.style.animation = 'none';
    setTimeout(() => {
      row.style.animation = `fadeInRow 0.3s ease forwards ${index * 0.02}s`;
      tbody.appendChild(row);
    }, 10);
  });
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

