let landingpage = false;
let testing = true;

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signInAnonymously, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyClZuFFFxtiwJar_YLrC8-G4ZSC5kSJJdU",
  authDomain: "group-payment-tracker.firebaseapp.com",
  projectId: "group-payment-tracker",
  storageBucket: "group-payment-tracker.firebasestorage.app",
  messagingSenderId: "208078945785",
  appId: "1:208078945785:web:5164201a43e0bd37c8d128"
};

const REQUIRED_TOTAL_AMOUNT = 400;
const MAX_TABS = 5;

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
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 p-4 rounded shadow-lg z-[10001] ${
    type === 'success' ? 'bg-green-500 text-white' : 
    type === 'error' ? 'bg-red-500 text-white' : 
    type === 'warning' ? 'bg-yellow-500 text-white' : 
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

const handleError = (error, context = 'Operation') => {
  console.error(`${context} failed:`, error);
  showNotification(`${context} failed. Please try again.`, 'error');
};

// Auth functions
function updateUI(user) {
  if (testing) {
    document.getElementById("payment-form-section").classList.remove("hidden");
    document.getElementById("payment-history-section").classList.remove("hidden");
  } else {
    const isSignedIn = user && !user.isAnonymous;
    if (isSignedIn) {
      currentUser = user;
      if (
        currentUser &&
        (currentUser.email === "johncadaro6@gmail.com" ||
         currentUser.email === "loonalexa86@gmail.com")
      ) {
        document.getElementById("payment-form-section").classList.remove("hidden");
        document.getElementById("payment-history-section").classList.remove("hidden");
      }
    } else {
      if (landingpage) {
        window.location.href = "LandingPage.html";
        return;
      }
      currentUser = null;
      document.getElementById("payment-form-section").classList.add("hidden");
      document.getElementById("payment-history-section").classList.add("hidden");
    }
  }
}

onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "LandingPage.html";
    return;
  }
  updateUI(user);
  if (user) setupListeners();
});

function calculateMemberProgressV2(memberName, payments) {
  const memberPayments = payments.filter(p => p.name === memberName);
  const totalPaid = memberPayments.reduce((sum, p) => sum + p.amount, 0);

  const progress = Math.min((totalPaid / REQUIRED_TOTAL_AMOUNT) * 100, 100);
  const isPaid = totalPaid >= REQUIRED_TOTAL_AMOUNT;
  const amountRemaining = Math.max(0, REQUIRED_TOTAL_AMOUNT - totalPaid);

  return {
    progress,
    isPaid,
    totalPaid,
    amountRemaining,
    requiredAmount: REQUIRED_TOTAL_AMOUNT
  };
}

async function setupListeners() {
  try {
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

      if (
        currentUser &&
        (currentUser.email === "johncadaro6@gmail.com" ||
         currentUser.email === "loonalexa86@gmail.com")
      ) {
        renderTableV2();
        renderHistory();
      } else {
        renderTableV2();
      }
    }, (error) => {
      handleError(error, 'Loading payments');
    });
  } catch (error) {
    handleError(error, 'Setup');
  }
}

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

function renderTableV2() {
  const tbody = document.getElementById("tracker-body");
  tbody.innerHTML = "";

  if (members.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-gray-500">No members found</td></tr>';
    return;
  }

  let totalCollected = 0;
  let totalRequired = REQUIRED_TOTAL_AMOUNT * members.length;

  members.forEach(member => {
    const progressData = calculateMemberProgressV2(member.Name, payments);
    totalCollected += progressData.totalPaid;

    let barColor = "bg-red-500";
    if (progressData.isPaid) {
      barColor = "bg-green-500";
    } else if (progressData.progress > 0) {
      barColor = "bg-orange-400";
    }

    let statusIndicator = '';
    if (progressData.isPaid) {
      statusIndicator = '<p class="text-xs text-center font-bold text-green-600">✓ Fully Paid</p>';
    } else if (progressData.amountRemaining > 0) {
      statusIndicator = `<p class="text-xs text-center text-red-600">Need: ₱${progressData.amountRemaining}</p>`;
    }

    let row = `
      <tr class="border-b hover:bg-gray-50">
        <td class="px-4 py-3 font-medium">${member.Name}</td>
        <td class="px-4 py-3">
          <div class="progress-bar-bg mb-2">
            <div class="progress-bar ${barColor}" style="width:${progressData.progress}%">
              ${progressData.progress > 0 ? `<span class="progress-percentage">${Math.round(progressData.progress)}%</span>` : ''}
            </div>
          </div>
          ${statusIndicator}
        </td>
        <td class="px-4 py-3 text-right">${formatCurrency(progressData.totalPaid)} / ${formatCurrency(REQUIRED_TOTAL_AMOUNT)}</td>
      </tr>
    `;
    tbody.innerHTML += row;
  });

  updateSummary(totalCollected, totalRequired);
}

function updateSummary(totalCollected, totalRequired) {
  const totalOutstanding = Math.max(0, totalRequired - totalCollected);

  document.getElementById("total-collected").textContent = formatCurrency(totalCollected);
  document.getElementById("total-outstanding").textContent = formatCurrency(totalOutstanding);

  updateChart(totalCollected, totalOutstanding);
}

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
      <td class="px-3 py-2 flex gap-2">
        ${currentUser && !currentUser.isAnonymous
          ? `
            <button data-id="${payment.id}" class="update-btn text-blue-600 hover:text-blue-800 hover:underline text-sm">Update</button>
            <button data-id="${payment.id}" class="delete-btn text-red-600 hover:text-red-800 hover:underline text-sm">Delete</button>
          `
          : `<span class="text-zinc-400 text-sm">View only</span>`}
      </td>`;
    
    tbody.appendChild(tr);
  });

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

    document.querySelectorAll(".update-btn").forEach(btn => {
      btn.onclick = async (e) => {
        const newAmount = prompt("Enter new payment amount:");
        if (newAmount === null || newAmount.trim() === "") return;

        try {
          await updateDoc(doc(db, "payments", e.target.dataset.id), {
            amount: parseFloat(newAmount),
            timestamp: new Date()
          });
          showNotification('Payment updated successfully', 'success');
        } catch (error) {
          handleError(error, 'Update payment');
        }
      };
    });
  }
}

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

document.getElementById("payment-form").querySelector('button[type="add-member"]').addEventListener("click", async (e) => {
  e.preventDefault();
  
  if (!testing) {
    if (!currentUser || currentUser.isAnonymous) {
      showNotification('Please sign in to add members', 'error');
      return;
    }
  }
  const nameSelect = document.getElementById("name-select");
  const newMemberName = prompt("Enter new member's name:").trim();

  if (!newMemberName) {
    showNotification('Please enter a valid member name', 'error');
    return;
  }

  if (newMemberName.length < 2) {
    showNotification('Member name must be at least 2 characters', 'error');
    return;
  }

  const addMemberBtn = e.target;
  addMemberBtn.disabled = true;
  addMemberBtn.textContent = 'Adding...';

  try {
    await addDoc(collection(db, "members"), {
      name: newMemberName,
      timestamp: serverTimestamp(),
      addedBy: currentUser.email
    });

    const newOption = document.createElement("option");
    newOption.value = newMemberName;
    newOption.textContent = newMemberName;
    nameSelect.appendChild(newOption);
    nameSelect.value = newMemberName;

    showNotification(`Member ${newMemberName} added successfully`, 'success');
    nameSelect.focus();

  } catch (error) {
    handleError(error, 'Add member');
  } finally {
    addMemberBtn.disabled = false;
    addMemberBtn.textContent = 'Add Member';
  }
});

// Tabs Feature
async function createDefaultTab() {
  if (!currentUser || currentUser.isAnonymous) {
    return; // Don't create default tab for anonymous users
  }

  try {
    const tabsRef = collection(db, "tabs");
    await addDoc(tabsRef, {
      createdBy: currentUser.email,
      tab_name: "Overview",
      tab_arrangement: 1
    });
    showNotification("Default tab 'Overview' created", 'success');
  } catch (error) {
    handleError(error, 'Create default tab');
  }
}

document.getElementById("add-tab-btn").addEventListener("click", async (e) => {
  e.preventDefault();
  
  if (!currentUser || currentUser.isAnonymous) {
    showNotification('Please sign in to add tabs', 'error');
    return;
  }

  if (!checkTabLimit()) {
    showNotification(`You can only have up to ${MAX_TABS} tabs.`, 'error');
    return;
  }

  const tabName = prompt("Enter tab name:").trim();

  if (!tabName) {
    showNotification('Please enter a valid tab name', 'error');
    return;
  }

  if (tabName.length < 2) {
    showNotification('Tab name must be at least 2 characters', 'error');
    return;
  }

  const addTabBtn = e.target;
  addTabBtn.disabled = true;
  addTabBtn.textContent = 'Adding...';

  try {
    const tabsRef = collection(db, "tabs");
    const querySnapshot = await getDocs(tabsRef);
    const maxArrangement = querySnapshot.docs.reduce((max, doc) => {
      const arrangement = doc.data().tab_arrangement || 0;
      return Math.max(max, arrangement);
    }, 0);

    await addDoc(tabsRef, {
      createdBy: currentUser.email,
      tab_name: tabName,
      tab_arrangement: maxArrangement + 1
    });

    await loadTabs();

    showNotification(`Tab ${tabName} added successfully`, 'success');

  } catch (error) {
    handleError(error, 'Add tab');
  } finally {
    addTabBtn.disabled = false;
    addTabBtn.textContent = 'Add Tab';
  }
});

function checkTabLimit() {
  const tabs = document.querySelectorAll(".tab");
  if (tabs.length >= MAX_TABS) {
    document.getElementById("add-tab-btn").style.display = "none";
    return false;
  } else {
    document.getElementById("add-tab-btn").style.display = "inline-flex";
    return true;
  }
}

async function loadTabs() {
  try {
    const tabsRef = collection(db, "tabs");
    const q = query(tabsRef, orderBy("tab_arrangement", "asc"));
    const querySnapshot = await getDocs(q);
    const tabsContainer = document.getElementById("tabs");
    
    tabsContainer.innerHTML = '';

    // Check if tabs collection is empty and create default tab if needed
    if (querySnapshot.empty && currentUser && !currentUser.isAnonymous) {
      await createDefaultTab();
      // Reload tabs after creating default
      const updatedSnapshot = await getDocs(q);
      updatedSnapshot.forEach(doc => {
        const tabData = doc.data();
        const tabElement = document.createElement("div");
        tabElement.className = "tab flex items-center";
        tabElement.draggable = true;
        tabElement.dataset.tabId = doc.id;
        tabElement.innerHTML = `
          <span>${tabData.tab_name}</span>
          <button class="tab-close text-red-600 font-bold ml-4">&times;</button>
        `;
        
        tabElement.addEventListener("click", () => {
          document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
          tabElement.classList.add("active");
          handleTabClick(tabData.tab_name, doc.id);
        });

        tabElement.querySelector(".tab-close").addEventListener("click", async (e) => {
          e.stopPropagation();
          const warningMessage = `
            ⚠️ DANGER: You are about to permanently remove this tab.
            
            ❗ Important data inside this tab CANNOT be retrieved once deleted.
            
            Do you really want to continue?`;
          if (confirm(warningMessage)) {
            try {
              await deleteDoc(doc(db, "tabs", doc.id));
              showNotification("Tab deleted permanently!", "error");
              checkTabLimit();
            } catch (error) {
              handleError(error, 'Delete tab');
            }
          } else {
            showNotification("Deletion canceled", "warning");
          }
        });

        tabElement.addEventListener("dragstart", (e) => {
          e.dataTransfer.setData("text/plain", doc.id);
          tabElement.classList.add("opacity-50");
        });

        tabElement.addEventListener("dragend", () => {
          tabElement.classList.remove("opacity-50");
        });

        tabsContainer.appendChild(tabElement);
      });
    } else {
      // Render existing tabs
      querySnapshot.forEach(doc => {
        const tabData = doc.data();
        const tabElement = document.createElement("div");
        tabElement.className = "tab flex items-center";
        tabElement.draggable = true;
        tabElement.dataset.tabId = doc.id;
        tabElement.innerHTML = `
          <span>${tabData.tab_name}</span>
          <button class="tab-close text-red-600 font-bold ml-4">&times;</button>
        `;
        
        tabElement.addEventListener("click", () => {
          document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
          tabElement.classList.add("active");
          handleTabClick(tabData.tab_name, doc.id);
        });

        tabElement.querySelector(".tab-close").addEventListener("click", async (e) => {
          e.stopPropagation();
          const warningMessage = `
            ⚠️ DANGER: You are about to permanently remove this tab.
            
            ❗ Important data inside this tab CANNOT be retrieved once deleted.
            
            Do you really want to continue?`;
          if (confirm(warningMessage)) {
            try {
              await deleteDoc(doc(db, "tabs", doc.id));
              showNotification("Tab deleted permanently!", "error");
              checkTabLimit();
            } catch (error) {
              handleError(error, 'Delete tab');
            }
          } else {
            showNotification("Deletion canceled", "warning");
          }
        });

        tabElement.addEventListener("dragstart", (e) => {
          e.dataTransfer.setData("text/plain", doc.id);
          tabElement.classList.add("opacity-50");
        });

        tabElement.addEventListener("dragend", () => {
          tabElement.classList.remove("opacity-50");
        });

        tabsContainer.appendChild(tabElement);
      });
    }

    tabsContainer.appendChild(document.getElementById("add-tab-btn"));
    checkTabLimit();

  } catch (error) {
    handleError(error, 'Load tabs');
  }
}

const tabsContainer = document.getElementById("tabs");
tabsContainer.addEventListener("dragover", async (e) => {
  e.preventDefault();
  const dragging = document.querySelector(".tab.opacity-50");
  const draggingId = e.dataTransfer.getData("text/plain");
  const afterElement = [...tabsContainer.querySelectorAll(".tab:not(.opacity-50)")].find(tab => {
    const rect = tab.getBoundingClientRect();
    return e.clientX < rect.left + rect.width / 2;
  });

  if (afterElement) {
    tabsContainer.insertBefore(dragging, afterElement);
  } else {
    tabsContainer.insertBefore(dragging, document.getElementById("add-tab-btn"));
  }

  const tabs = [...tabsContainer.querySelectorAll(".tab")];
  const updates = tabs.map((tab, index) => {
    return updateDoc(doc(db, "tabs", tab.dataset.tabId), {
      tab_arrangement: index + 1
    });
  });

  try {
    await Promise.all(updates);
  } catch (error) {
    handleError(error, 'Reorder tabs');
  }
});

function handleTabClick(tabName, tabId) {
  showNotification(`Switched to tab: ${tabName}`, 'success');
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadTabs();
  checkTabLimit();

  document.querySelector("[data-open-info]").addEventListener("click", () => {
    document.getElementById("info-modal").classList.remove("hidden");
  });
  document.querySelector("[data-close-info]").addEventListener("click", () => {
    document.getElementById("info-modal").classList.add("hidden");
  });

  const settingsBtn = document.getElementById("settings-btn");
  const settingsMenu = document.getElementById("settings-menu");

  settingsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    settingsMenu.classList.toggle("hidden");
  });

  document.addEventListener("click", (e) => {
    if (!settingsMenu.contains(e.target) && e.target !== settingsBtn) {
      settingsMenu.classList.add("hidden");
    }
  });

  const loadingScreen = document.getElementById("loading-screen");
  try {
    const membersSnap = await getDocs(collection(db, "members"));
    const paymentsSnap = await getDocs(collection(db, "payments"));
    loadingScreen.classList.add("hidden");
  } catch (error) {
    console.error("Error loading data:", error);
    loadingScreen.classList.add("hidden");
  }
});

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    const form = document.getElementById("payment-form");
    if (form && !form.classList.contains('hidden')) {
      form.dispatchEvent(new Event('submit'));
    }
  }
});