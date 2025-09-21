import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signInAnonymously, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// Firebase Config - Consider moving to environment variables in production
const firebaseConfig = {
  apiKey: "AIzaSyClZuFFFxtiwJar_YLrC8-G4ZSC5kSJJdU",
  authDomain: "group-payment-tracker.firebaseapp.com",
  projectId: "group-payment-tracker",
  storageBucket: "group-payment-tracker.firebasestorage.app",
  messagingSenderId: "208078945785",
  appId: "1:208078945785:web:5164201a43e0bd37c8d128"
};

// Constants
const REQUIRED_AMOUNT_PER_MONTH = 130;
const PENALTY_AMOUNT = 20;
const MONTHS = [
  { name: "Sept", year: 2024, index: 8 }, // September is month 8 (0-indexed)
  { name: "Oct", year: 2024, index: 9 },
  { name: "Nov", year: 2024, index: 10 },
  { name: "Dec", year: 2024, index: 11 }
];

// Helper function to get month end date
const getMonthEndDate = (year, monthIndex) => {
  return new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Global state
let currentUser = null;
let chart = null;
let members = [];
let payments = [];

// Utility functions
const formatCurrency = (amount) => `₱${amount.toLocaleString()}`;
const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";
  
  let date;
  if (typeof timestamp === "object" && timestamp.toDate) {
    date = timestamp.toDate();
  } else if (typeof timestamp === "string" || typeof timestamp === "number") {
    date = new Date(timestamp);
  } else {
    return "N/A";
  }
  
  return date.toLocaleDateString() + " " + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
};

const showNotification = (message, type = 'info') => {
  // Create a simple notification system
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 p-4 rounded shadow-lg z-50 ${
    type === 'success' ? 'bg-green-500 text-white' : 
    type === 'error' ? 'bg-red-500 text-white' : 
    'bg-blue-500 text-white'
  }`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
};

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Enhanced error handling
const handleError = (error, context = 'Operation') => {
  console.error(`${context} failed:`, error);
  showNotification(`${context} failed. Please try again.`, 'error');
};

// Auth functions
const authBtn = document.getElementById("auth-btn");
const userIdEl = document.getElementById("user-id");

function updateUI(user) {
  const isSignedIn = user && !user.isAnonymous;
  
  if (isSignedIn) {
    currentUser = user;
    userIdEl.textContent = user.displayName || user.email;
    authBtn.textContent = "Sign Out";
    authBtn.className = "mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700";
    document.getElementById("payment-form-section").classList.remove("hidden");
    document.getElementById("payment-history-section").classList.remove("hidden");
  } else {
    currentUser = null;
    userIdEl.textContent = "Guest (Read-only)";
    authBtn.textContent = "Sign In with Google";
    authBtn.className = "mt-2 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700";
    document.getElementById("payment-form-section").classList.add("hidden");
    document.getElementById("payment-history-section").classList.add("hidden");
  }
}

authBtn.addEventListener("click", async () => {
  try {
    if (currentUser) {
      await signOut(auth);
      showNotification("Signed out successfully", 'success');
    } else {
      await signInWithPopup(auth, new GoogleAuthProvider());
      showNotification("Signed in successfully", 'success');
    }
  } catch (error) {
    handleError(error, 'Authentication');
  }
});

onAuthStateChanged(auth, user => {
  if (!user) {
    signInAnonymously(auth).catch(error => handleError(error, 'Anonymous sign-in'));
  }
  updateUI(user);
  if (user) setupListeners();
});

// Fixed payment calculation logic with overpayment rollover and penalty handling
function calculateMemberProgress(memberName, payments) {
  const memberPayments = payments
    .filter(p => p.name === memberName)
    .sort((a, b) => {
      const aDate = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0);
      const bDate = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0);
      return aDate - bDate; // Sort by payment date ascending
    });

  const monthlyProgress = [];
  let carryOverAmount = 0; // Amount to carry over from previous months
  
  MONTHS.forEach((month, monthIndex) => {
    const monthEndDate = getMonthEndDate(month.year, month.index);
    
    // Get payments made specifically in this month
    const monthPayments = memberPayments.filter(payment => {
      const paymentDate = payment.timestamp?.toDate ? 
        payment.timestamp.toDate() : 
        new Date(payment.timestamp || 0);
      
      return paymentDate.getFullYear() === month.year && 
             paymentDate.getMonth() === month.index;
    });
    
    // Calculate total paid in this month + carry over from previous month
    const monthPaymentAmount = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalAvailableForMonth = monthPaymentAmount + carryOverAmount;
    
    // Check if previous months are incomplete (for penalty calculation)
    let penaltyApplied = false;
    let requiredAmountForMonth = REQUIRED_AMOUNT_PER_MONTH;
    
    // Check if this month needs to cover penalty from previous months
    if (monthIndex > 0) {
      const previousMonth = monthlyProgress[monthIndex - 1];
      if (!previousMonth.isPaid) {
        requiredAmountForMonth = REQUIRED_AMOUNT_PER_MONTH + PENALTY_AMOUNT; // ₱150
        penaltyApplied = true;
      }
    }
    
    // Determine if current month was paid on time (within the month)
    const paidOnTime = monthPaymentAmount >= REQUIRED_AMOUNT_PER_MONTH;
    
    // If not paid on time and we're past this month, apply penalty
    const currentDate = new Date();
    const isMonthPassed = currentDate > monthEndDate;
    
    if (!paidOnTime && isMonthPassed && totalAvailableForMonth < REQUIRED_AMOUNT_PER_MONTH) {
      // Month is incomplete and time has passed - penalty will apply for future payments
    }
    
    // Calculate how much goes to this month
    let amountAllocatedToMonth = 0;
    let progress = 0;
    let isPaid = false;
    
    if (totalAvailableForMonth >= requiredAmountForMonth) {
      // Enough to cover this month (including any penalty)
      amountAllocatedToMonth = requiredAmountForMonth;
      progress = 100;
      isPaid = true;
      carryOverAmount = totalAvailableForMonth - requiredAmountForMonth; // Excess carries over
    } else if (totalAvailableForMonth > 0) {
      // Partial payment
      amountAllocatedToMonth = totalAvailableForMonth;
      progress = (totalAvailableForMonth / requiredAmountForMonth) * 100;
      carryOverAmount = 0; // All used up
    } else {
      // No payment
      carryOverAmount = 0;
    }
    
    const amountRemaining = Math.max(0, requiredAmountForMonth - amountAllocatedToMonth);
    
    monthlyProgress.push({
      month: month.name,
      progress: Math.min(progress, 100), // Cap at 100%
      isPaid,
      amountPaid: amountAllocatedToMonth,
      amountRemaining,
      requiredAmount: requiredAmountForMonth,
      paymentsCount: monthPayments.length,
      payments: monthPayments,
      monthPaymentAmount, // Amount actually paid in this specific month
      carryOverReceived: monthIndex === 0 ? 0 : (totalAvailableForMonth - monthPaymentAmount),
      penaltyApplied,
      paidOnTime,
      totalAvailableForMonth
    });
  });
  
  return monthlyProgress;
}

// Enhanced data loading with loading states
async function setupListeners() {
  try {
    // Show loading state
    document.getElementById("tracker-body").innerHTML = '<tr><td colspan="5" class="text-center py-4">Loading...</td></tr>';
    
    const membersSnap = await getDocs(collection(db, "members"));
    members = membersSnap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
    
    populateMemberSelect(members);

    const paymentsQuery = query(collection(db, "payments"), orderBy("timestamp", "desc"));
    onSnapshot(paymentsQuery, (snap) => {
      payments = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      renderTable();
      renderHistory();
    }, (error) => {
      handleError(error, 'Loading payments');
    });
  } catch (error) {
    handleError(error, 'Setup');
  }
}

// Enhanced member select population
function populateMemberSelect(members) {
  const select = document.getElementById("name-select");
  select.innerHTML = '<option value="">Select a member...</option>';
  
  members
    .sort((a, b) => a.Name.localeCompare(b.Name))
    .forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.Name;
      opt.textContent = m.Name;
      select.appendChild(opt);
    });
}

// Enhanced table rendering with overpayment and penalty tracking
function renderTable() {
  const tbody = document.getElementById("tracker-body");
  tbody.innerHTML = "";
  
  if (members.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">No members found</td></tr>';
    return;
  }
  
  let totalCollected = 0;
  let totalRequired = 0;
  let totalPaidMonths = 0;
  let totalPossibleMonths = members.length * MONTHS.length;
  
  members.forEach(member => {
    const memberProgress = calculateMemberProgress(member.Name, payments);
    const memberTotalPaid = payments
      .filter(p => p.name === member.Name)
      .reduce((sum, p) => sum + p.amount, 0);
    
    totalCollected += memberTotalPaid;
    totalRequired += REQUIRED_AMOUNT_PER_MONTH * MONTHS.length;
    
    const completedMonths = memberProgress.filter(m => m.isPaid).length;
    totalPaidMonths += completedMonths;
    
    let row = `<tr class="border-b hover:bg-gray-50">
      <td class="px-4 py-3 font-medium">${member.Name}</td>`;

    memberProgress.forEach(monthData => {
      // Determine bar color based on status
      let barColor = "bg-red-500"; // Default: not paid
      if (monthData.isPaid) {
        barColor = monthData.penaltyApplied ? "bg-yellow-500" : "bg-green-500";
      } else if (monthData.progress > 0) {
        barColor = "bg-orange-400"; // Partial payment
      }
      
      const progressText = `${Math.round(monthData.progress)}%`;
      
      // Create detailed tooltip
      let tooltipText = `${monthData.month} - Required: ₱${monthData.requiredAmount}`;
      tooltipText += `\nAllocated to this month: ₱${monthData.amountPaid}`;
      
      if (monthData.monthPaymentAmount > 0) {
        tooltipText += `\nActual payments in ${monthData.month}: ₱${monthData.monthPaymentAmount}`;
      }
      
      if (monthData.carryOverReceived > 0) {
        tooltipText += `\nCarry-over from previous: ₱${monthData.carryOverReceived}`;
      }
      
      if (monthData.penaltyApplied) {
        tooltipText += `\n⚠️ Penalty applied: +₱${PENALTY_AMOUNT}`;
      }
      
      if (monthData.payments.length > 0) {
        tooltipText += `\n\nPayment details:`;
        monthData.payments.forEach(payment => {
          const date = payment.timestamp?.toDate ? payment.timestamp.toDate() : new Date(payment.timestamp || 0);
          tooltipText += `\n• ₱${payment.amount} on ${date.toLocaleDateString()}`;
        });
      }
      
      // Status indicators
      let statusIndicator = '';
      if (monthData.isPaid) {
        if (monthData.penaltyApplied) {
          statusIndicator = '<p class="text-xs text-yellow-600 text-center">⚠️ Paid + Penalty</p>';
        } else {
          statusIndicator = '<p class="text-xs text-green-600 text-center">✓ Complete</p>';
        }
      } else if (monthData.amountRemaining > 0) {
        const needsAmount = monthData.amountRemaining;
        statusIndicator = `<p class="text-xs text-red-600 text-center">Need: ₱${needsAmount}</p>`;
      }
      
      row += `
        <td class="px-4 py-3">
          <div class="progress-bar-bg mb-1" title="${tooltipText}">
            <div class="progress-bar ${barColor}" style="width:${monthData.progress}%"></div>
          </div>
          <p class="text-xs font-semibold text-center">${progressText}</p>
          ${statusIndicator}
        </td>`;
    });

    // Calculate total expected vs actual for this member
    const expectedTotal = REQUIRED_AMOUNT_PER_MONTH * MONTHS.length;
    const completionRate = (completedMonths / MONTHS.length * 100).toFixed(0);
    
    row += `<td class="px-4 py-3 text-sm text-right">
      <div class="font-semibold">${formatCurrency(memberTotalPaid)}</div>
      <div class="text-gray-500 text-xs">${completedMonths}/${MONTHS.length} months</div>
      <div class="text-gray-500 text-xs">(${completionRate}% complete)</div>
    </td></tr>`;
    tbody.innerHTML += row;
  });

  updateSummary(totalCollected, totalRequired, totalPaidMonths, totalPossibleMonths);
}

// Enhanced summary with month completion tracking
function updateSummary(totalCollected, totalRequired, totalPaidMonths, totalPossibleMonths) {
  const totalOutstanding = Math.max(0, totalRequired - totalCollected);
  
  document.getElementById("total-collected").textContent = formatCurrency(totalCollected);
  document.getElementById("total-outstanding").textContent = formatCurrency(totalOutstanding);
  
  // Update chart
  updateChart(totalCollected, totalOutstanding);
  
  // Add enhanced collection statistics
  const collectionRate = totalRequired > 0 ? (totalCollected / totalRequired * 100) : 0;
  const monthCompletionRate = totalPossibleMonths > 0 ? (totalPaidMonths / totalPossibleMonths * 100) : 0;
  
  const summaryContainer = document.querySelector('#total-collected').parentNode.parentNode;
  
  // Remove existing rate if it exists
  const existingRate = summaryContainer.querySelector('.collection-rate');
  if (existingRate) existingRate.remove();
  
  // Add enhanced collection rate with month completion
  const rateDiv = document.createElement('div');
  rateDiv.className = 'collection-rate col-span-2 mt-4 space-y-3';
  rateDiv.innerHTML = `
    <div class="text-center">
      <p class="text-sm text-zinc-500">Collection Rate</p>
      <p class="text-lg font-bold ${collectionRate >= 80 ? 'text-green-600' : collectionRate >= 50 ? 'text-orange-500' : 'text-red-600'}">${collectionRate.toFixed(1)}%</p>
    </div>
    <div class="text-center">
      <p class="text-sm text-zinc-500">Months Completed</p>
      <p class="text-lg font-bold ${monthCompletionRate >= 80 ? 'text-green-600' : monthCompletionRate >= 50 ? 'text-orange-500' : 'text-red-600'}">${totalPaidMonths}/${totalPossibleMonths}</p>
      <p class="text-xs text-gray-500">(${monthCompletionRate.toFixed(1)}%)</p>
    </div>
  `;
  summaryContainer.appendChild(rateDiv);
}

// Enhanced chart rendering
function updateChart(collected, outstanding) {
  const ctx = document.getElementById("overall-progress-chart").getContext("2d");
  
  if (chart) {
    chart.destroy();
  }
  
  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Collected", "Outstanding"],
      datasets: [{
        data: [collected, outstanding],
        backgroundColor: ["#22c55e", "#ef4444"],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 20,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.label + ': ' + formatCurrency(context.parsed);
            }
          }
        }
      }
    }
  });
}

// Enhanced history rendering with search and filtering
function renderHistory() {
  const tbody = document.getElementById("payment-log-body");
  tbody.innerHTML = "";
  
  if (payments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-500">No payments recorded</td></tr>';
    return;
  }
  
  payments.forEach(payment => {
    const tr = document.createElement("tr");
    tr.className = "border-b hover:bg-gray-50";
    
    tr.innerHTML = `
      <td class="px-3 py-2 font-medium">${payment.name}</td>
      <td class="px-3 py-2">${formatCurrency(payment.amount)}</td>
      <td class="px-3 py-2 text-sm">${formatDate(payment.timestamp)}</td>
      <td class="px-3 py-2">
        ${currentUser && !currentUser.isAnonymous
          ? `<button data-id="${payment.id}" class="delete-btn text-red-600 hover:text-red-800 hover:underline text-sm">Delete</button>`
          : `<span class="text-zinc-400 text-sm">View only</span>`}
      </td>`;
    tbody.appendChild(tr);
  });

  // Add delete functionality
  if (currentUser && !currentUser.isAnonymous) {
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.onclick = async (e) => {
        if (confirm('Are you sure you want to delete this payment?')) {
          try {
            await deleteDoc(doc(db, "payments", e.target.dataset.id));
            showNotification('Payment deleted successfully', 'success');
          } catch (error) {
            handleError(error, 'Delete payment');
          }
        }
      };
    });
  }
}

// Enhanced form handling with validation
document.getElementById("payment-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  if (!currentUser || currentUser.isAnonymous) {
    showNotification('Please sign in to add payments', 'error');
    return;
  }

  const nameSelect = document.getElementById("name-select");
  const amountInput = document.getElementById("amount-input");
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  const name = nameSelect.value.trim();
  const amount = parseFloat(amountInput.value);

  // Validation
  if (!name) {
    showNotification('Please select a member', 'error');
    nameSelect.focus();
    return;
  }
  
  if (isNaN(amount) || amount <= 0) {
    showNotification('Please enter a valid amount', 'error');
    amountInput.focus();
    return;
  }
  
  if (amount > 10000) {
    if (!confirm(`Are you sure you want to add a payment of ${formatCurrency(amount)}? This seems unusually high.`)) {
      return;
    }
  }

  // Disable submit button to prevent double submission
  submitBtn.disabled = true;
  submitBtn.textContent = 'Adding...';

  try {
    await addDoc(collection(db, "payments"), {
      name,
      amount,
      timestamp: serverTimestamp(),
      addedBy: currentUser.email
    });
    
    showNotification(`Payment of ${formatCurrency(amount)} added for ${name}`, 'success');
    e.target.reset();
    nameSelect.focus();
    
  } catch (error) {
    handleError(error, 'Add payment');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add Payment';
  }
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    const form = document.getElementById("payment-form");
    if (form && !form.classList.contains('hidden')) {
      form.dispatchEvent(new Event('submit'));
    }
  }
});

// Initialize tooltips on hover
document.addEventListener('DOMContentLoaded', () => {
  // Add any additional initialization here
  console.log('Group Payment Tracker initialized');
});
