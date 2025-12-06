import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, query } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { decodeData } from "./codec.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyClZuFFFxtiwJar_YLrC8-G4ZSC5kSJJdU",
  authDomain: "group-payment-tracker.firebaseapp.com",
  projectId: "group-payment-tracker",
  storageBucket: "group-payment-tracker.firebasestorage.app",
  messagingSenderId: "208078945785",
  appId: "1:208078945785:web:5164201a43e0bd37c8d128"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Animated counter function
function animateCounter(element, start, end, duration = 2000, prefix = '', suffix = '') {
  const startTime = performance.now();
  const isDecreasing = end < start;
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function for smooth animation
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const current = Math.floor(start + (end - start) * easeOutQuart);
    
    // Format number with commas
    const formatted = current.toLocaleString();
    element.textContent = `${prefix}${formatted}${suffix}`;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = `${prefix}${end.toLocaleString()}${suffix}`;
    }
  }
  
  requestAnimationFrame(update);
}

// Format currency
function formatCurrency(amount) {
  if (amount >= 1000000) {
    return `₱${(amount / 1000000).toFixed(1)}M+`;
  } else if (amount >= 1000) {
    return `₱${(amount / 1000).toFixed(0)}K+`;
  } else {
    return `₱${amount.toLocaleString()}`;
  }
}

// Initialize stats tracking
let previousActiveGroups = 0;
let previousTotalTracked = 0;

// Real-time listener for active groups (document count)
function trackActiveGroups() {
  const activeGroupsElement = document.getElementById('active-groups-stat');
  if (!activeGroupsElement) return;

  const membersRef = collection(db, 'members');
  const q = query(membersRef);

  onSnapshot(q, (snapshot) => {
    const currentCount = snapshot.size;
    console.log('Active Groups updated:', currentCount);
    
    // Remove loading state from card and add loaded animation
    const card = document.getElementById('active-groups-card');
    if (card && card.classList.contains('loading')) {
      card.classList.remove('loading');
      card.classList.add('loaded');
      activeGroupsElement.classList.add('loaded');
    }
    
    // Animate from previous to current
    animateCounter(activeGroupsElement, previousActiveGroups, currentCount, 1500, '', '+');
    previousActiveGroups = currentCount;
  }, (error) => {
    console.error('Error tracking active groups:', error);
    const card = document.getElementById('active-groups-card');
    if (card) card.classList.remove('loading');
    activeGroupsElement.textContent = '0+';
  });
}

// Real-time listener for total tracked amount
function trackTotalAmount() {
  const totalTrackedElement = document.getElementById('total-tracked-stat');
  if (!totalTrackedElement) return;

  const membersRef = collection(db, 'members');
  const q = query(membersRef);

  onSnapshot(q, async (snapshot) => {
    let totalAmount = 0;
    let totalTabs = 0;
    let totalMembers = 0;
    let totalPayments = 0;

    // Calculate sum of all totalRequired from all decoded tabs
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const decoded = decodeData(data.blob_data || "{}") || {};

      // Count members and payments for logging
      if (decoded.members && Array.isArray(decoded.members)) {
        totalMembers += decoded.members.length;
      }
      if (decoded.payments && Array.isArray(decoded.payments)) {
        totalPayments += decoded.payments.length;
      }

      // Get the tab default amount for this document
      if (decoded.tabDefaultAmounts) {
        const tabId = docSnap.id;
        const defaultAmount = decoded.tabDefaultAmounts[tabId];
        
        if (defaultAmount && typeof defaultAmount === 'number') {
          // Count members for this tab
          const membersInTab = decoded.members ? 
            decoded.members.filter(m => m.tabId === tabId || !m.tabId).length : 0;
          
          // Total required = default amount * number of members
          const tabTotal = defaultAmount * membersInTab;
          totalAmount += tabTotal;
          totalTabs++;
        }
      }
    });

    console.log(`Total Tracked updated: ₱${totalAmount.toLocaleString()} (${totalTabs} tabs, ${totalMembers} members, ${totalPayments} payments)`);
    
    // Remove loading state from card and add loaded animation
    const card = document.getElementById('total-tracked-card');
    if (card && card.classList.contains('loading')) {
      card.classList.remove('loading');
      card.classList.add('loaded');
      totalTrackedElement.classList.add('loaded');
    }
    
    // Animate the number
    const startAmount = previousTotalTracked;
    const endAmount = totalAmount;
    const duration = 2000;
    const startTime = performance.now();
    
    function updateAmount(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(startAmount + (endAmount - startAmount) * easeOutQuart);
      
      totalTrackedElement.textContent = formatCurrency(current);
      
      if (progress < 1) {
        requestAnimationFrame(updateAmount);
      } else {
        totalTrackedElement.textContent = formatCurrency(endAmount);
      }
    }
    
    requestAnimationFrame(updateAmount);
    previousTotalTracked = totalAmount;
  }, (error) => {
    console.error('Error tracking total amount:', error);
    const card = document.getElementById('total-tracked-card');
    if (card) card.classList.remove('loading');
    totalTrackedElement.textContent = '₱0';
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing dynamic stats...');
    trackActiveGroups();
    trackTotalAmount();
  });
} else {
  console.log('Initializing dynamic stats...');
  trackActiveGroups();
  trackTotalAmount();
}
