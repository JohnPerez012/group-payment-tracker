import { encodeData, decodeData } from "./codec.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, setDoc, deleteDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";



const sectionToToggle = [
  "monthly-overview-section",
  "payment-summary-section",
  "quick-info-section",
  "payment-form-section",
  "payment-history-section"
];

let quickInfoData = []; // Store quick info items

function UIState() {
  console.log("UIState");

  const shouldShow = Array.isArray(tabs) && tabs.length > 0 && !!activeTabId;

  sectionToToggle.forEach(sectionId => {
    const section = document.getElementById(sectionId);
    if (!section) return;
    if (shouldShow) {
      section.classList.remove("hidden");
    } else {
      section.classList.add("hidden");
    }
  });


  checkHiddenSections();
}


function checkHiddenSections() {
  console.log("checkHiddenSections");

  const messages = [
    "Nothing to show yet!",
    "Add tab to start",
    "Select tab to start",
    "Maybe it's lag? Then refresh / reload",
    "Blue plus button to add tab",
    "Your tabs will appear there at the top",
    "Getting to know this app? Go to About section",
    "Share your UID with friends!",
    "Delete tabs you don't need anymore!",
    "Click on a tab to view!",
    "View Web Developers' profiles; they're so cringeworthy! 💀",
    "At least 5 tabs are allowed",
    "Manage your group payments here",
    "Click the name of the member to edit it",
    "Start your tracking now!"
  ];

  const gifId = "empty-state-gif";
  let gifContainer = document.getElementById(gifId);

  // 🧩 Inject responsive CSS only once
  if (!document.getElementById("empty-state-style")) {
    const style = document.createElement("style");
    style.id = "empty-state-style";
    style.textContent = `
      #empty-state-gif {
        display: none;
        text-align: center;
        margin: 40px auto;
        opacity: 0;
        transition: opacity 0.4s ease;
      }

      #empty-state-gif img {
        max-width: 300px;
        height: auto;
        display: block;
        margin: 0 auto;
      }

      #message-container {
        position: relative;
        overflow: hidden;
        height: 1.9em;
        margin-top: 20px;
        color: #6b7280;
        font-weight: 500;
      }

      #empty-text {
        position: absolute;
        width: 100%;
        left: 0;
        top: 0;
        text-align: center;
        transform: translateY(0);
        transition: transform 0.6s ease;
      }

      /* Responsive adjustments */
      @media (max-width: 600px) {
        #empty-state-gif img {
          max-width: 220px;
        }
        #message-container {
          font-size: 1.2rem;
          margin-top: 12px;
        }
      }

      @media (min-width: 601px) and (max-width: 1024px) {
        #empty-state-gif img {
          max-width: 260px;
        }
        #message-container {
          font-size: 1.6rem;
        }
      }

      @media (min-width: 1025px) {
        #message-container {
          font-size: 2rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ✅ Create container if missing
  if (!gifContainer) {
    gifContainer = document.createElement("div");
    gifContainer.id = gifId;
    gifContainer.innerHTML = `
      <img src="assets/icons/Collaboration_Animation.gif" 
           alt="Collaboration animation" />
      <div id="message-container">
        <p id="empty-text">Hello There!</p>
      </div>
    `;

    const tabsContainer = document.getElementById("tabs-container");
    if (tabsContainer) {
      tabsContainer.insertAdjacentElement("afterend", gifContainer);
    } else {
      document.body.appendChild(gifContainer);
    }
  }

  // ✅ Determine if all sections are hidden
  const allHidden = sectionToToggle.every(id => {
    const el = document.getElementById(id);
    return el && el.classList.contains("hidden");
  });

  // 🌀 Message scroll setup
  const emptyText = gifContainer.querySelector("#empty-text");
  let intervalId = gifContainer.dataset.intervalId;

  // 🧩 Utility: shuffle messages (Fisher–Yates)
  function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const startMessageScroll = () => {
    if (intervalId) return; // already running

    let randomized = shuffleArray(messages);
    let messageIndex = 0;

    intervalId = setInterval(() => {
      emptyText.style.transform = "translateY(-100%)";

      setTimeout(() => {
        messageIndex = (messageIndex + 1) % randomized.length;
        if (messageIndex === 0) randomized = shuffleArray(messages); // reshuffle each full cycle

        emptyText.textContent = randomized[messageIndex];
        emptyText.style.transition = "none";
        emptyText.style.transform = "translateY(100%)";

        void emptyText.offsetHeight; // force reflow
        emptyText.style.transition = "transform 0.6s ease";
        emptyText.style.transform = "translateY(0)";
      }, 820);
    }, 3999);

    gifContainer.dataset.intervalId = intervalId;
  };

  const stopMessageScroll = () => {
    if (intervalId) {
      clearInterval(intervalId);
      gifContainer.dataset.intervalId = "";
    }
  };

  // 🎬 Show/hide the GIF + scroll
  if (allHidden) {
    gifContainer.style.display = "block";
    requestAnimationFrame(() => (gifContainer.style.opacity = "1"));
    startMessageScroll();
  } else {
    gifContainer.style.opacity = "0";
    stopMessageScroll();
    setTimeout(() => (gifContainer.style.display = "none"), 400);
  }
}

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

let currentUser = null;
let reyalAydi;
// Expose reyalAydi globally for QR code modal
window.reyalAydi = null;
let members = [];
let payments = [];
let tabs = [];
let activeTabId;
let chart = null;
let tabDefaultAmounts = {}; // Store tab-level defaults: { tabId: amount }


const DEFAULT_REQUIRED_AMOUNT = 1; // Renamed from REQUIRED_TOTAL_AMOUNT for clarity
const MAX_TABS = 5;



const formatCurrency = amount => `₱${amount.toLocaleString()}`;
const formatDate = ts => ts ? new Date(ts).toLocaleDateString() + " " + new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A";

const showNotification = (msg, type = 'info') => {
  const n = document.createElement('div');
  n.className = `fixed top-4 right-4 p-4 rounded shadow-lg z-[10001] ${type === 'success' ? 'bg-green-500 text-white' :
    type === 'error' ? 'bg-red-500 text-white' :
      type === 'warning' ? 'bg-yellow-500 text-white' : 'bg-blue-500 text-white'
    }`;
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 1000);
};

const handleError = (err, ctx = 'Operation') => { console.error(`${ctx} failed:`, err); showNotification(`${ctx} failed. Please try again.`, 'error'); };

async function saveData() {
  console.log("saveData");
  try {
    if (!currentUser || !currentUser.email) {
      showNotification("You must be signed in to save data", "error");
      return;
    }
    if (!activeTabId) {
      showNotification("No active tab selected to save to", "error");
      return;
    }

    // Include quickInfoData and tabDefaultAmounts in the encoded blob
    const encodedBlob = encodeData({
      members: members.filter(m => m.tabId === activeTabId),
      payments: payments.filter(p => p.tabId === activeTabId),
      tabs: tabs,
      quickInfo: quickInfoData.filter(qi => qi.tabId === activeTabId),
      tabDefaultAmounts: tabDefaultAmounts // Add this
    });

    await setDoc(doc(db, "members", activeTabId), {
      blob_data: encodedBlob
    }, { merge: true });

    showNotification("Data saved successfully", "success");
  } catch (error) {
    handleError(error, "Save data");
  }
}


function calculateMemberProgressV2(member, payments) {
  console.log("calculateMemberProgressV2 for", member.Name);
  const memberPayments = payments.filter(p => p.name === member.Name);
  const totalPaid = memberPayments.reduce((s, p) => s + p.amount, 0);

  // Determine required amount: custom > tab default > global default
  const tabDefault = tabDefaultAmounts[member.tabId] || DEFAULT_REQUIRED_AMOUNT;
  const requiredAmount = member.requiredAmount || tabDefault;

  const progress = Math.min((totalPaid / requiredAmount) * 100, 100);

  return {
    progress,
    isPaid: totalPaid >= requiredAmount,
    totalPaid,
    amountRemaining: Math.max(0, requiredAmount - totalPaid),
    requiredAmount: requiredAmount,
    isCustomAmount: !!member.requiredAmount,
    isTabDefault: !member.requiredAmount && tabDefault !== DEFAULT_REQUIRED_AMOUNT
  };
}

function populateMemberSelect(filteredMembers) {
  console.log("populateMemberSelect");
  const select = document.getElementById("name-select");
  select.innerHTML = '<option value="">Select a member...</option>';
  filteredMembers.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.Name;
    opt.textContent = m.Name;
    select.appendChild(opt);
  });
}


document.getElementById("total-collected").textContent = "₱0";
document.getElementById("total-outstanding").textContent = "₱0";
updateChart(0, 0);



function renderTableV2() {
  console.log("renderTableV2");
  const tbody = document.getElementById("tracker-body");
  tbody.innerHTML = "";
  const filteredMembers = members.filter(m => m.tabId === activeTabId);
  const filteredPayments = payments.filter(p => p.tabId === activeTabId);

  if (!filteredMembers.length) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-gray-500">No members found for this tab | scroll down to add member/s</td></tr>';
    updateSummary(0, 0);
    return;
  }

  let totalCollected = 0, totalRequired = 0;

  filteredMembers.forEach(member => {
    const prog = calculateMemberProgressV2(member, filteredPayments);
    totalCollected += prog.totalPaid;
    totalRequired += prog.requiredAmount;

    let barColor = prog.isPaid ? "bg-green-500" : prog.progress > 0 ? "bg-red-500" : "bg-orange-400";

    // Determine icon and styling
    let amountIcon = '✅'; // Default
    let amountClass = 'text-green-600';

    if (prog.isCustomAmount) {
      amountIcon = '✏️';
      amountClass = 'text-purple-600 font-bold';
    } else if (prog.isTabDefault) {
      amountIcon = '⚙️';
      amountClass = 'text-blue-600';
    }

    tbody.innerHTML += `
<tr class="border-b hover:bg-gray-50">
  <td class="px-4 py-3 font-medium name-cell transition-all duration-300 relative">
    <span class="member-name relative z-10" title="Click to rename • Double-click to delete">${member.Name}</span>
  </td>

  <td class="px-4 py-3">
    <div class="progress-bar-bg mb-2">
      <div class="progress-bar ${barColor}" style="width: ${prog.progress}%">
        ${prog.progress > 0 ? `<span class="progress-percentage">${Math.round(prog.progress)}%</span>` : ''}
      </div>
    </div>
    ${prog.isPaid
        ? '<p class="text-xs text-center font-bold text-green-600">✓ Fully Paid</p>'
        : `<p class="text-xs text-center text-red-600">Need: ₱${prog.amountRemaining}</p>`
      }
  </td>
  <td class="px-4 py-3 text-right">
    <span class="amount-display ${amountClass} cursor-pointer hover:underline transition-all duration-200" 
          data-member-id="${member.id}"
          title="Click to edit • Double-click to delete">
      ${formatCurrency(prog.totalPaid)} / ${formatCurrency(prog.requiredAmount)} ${amountIcon}
    </span>
  </td>
</tr>`;
  });

  updateSummary(totalCollected, totalRequired);
}


////////////////////////////////////////


document.getElementById("tracker-body").addEventListener("click", async (e) => {
  const nameSpan = e.target.closest(".member-name");

  if (!nameSpan) return;



  // Double-click detection
  if (e.detail === 2) {
    // Double-click - Delete confirmation
    await handleMemberDelete(nameSpan);
  } else {
    // Single-click - Rename
    setTimeout(() => {
      // Only proceed if it wasn't a double-click (check if another click happened within the timeout)
      if (!nameSpan.dataset.doubleClick) {
        handleMemberRename(nameSpan);
      }
      delete nameSpan.dataset.doubleClick;
    }, 300); // Wait to see if this becomes a double-click
  }
});

// Set double-click flag
document.getElementById("tracker-body").addEventListener("dblclick", (e) => {
  const nameSpan = e.target.closest(".member-name");
  if (nameSpan) {
    nameSpan.dataset.doubleClick = "true";
  }
});

// Rename function (extracted from original code)
async function handleMemberRename(nameSpan) {
  const oldName = nameSpan.textContent.trim();

  // Find the member in the current tab
  const filteredMembers = members.filter(m => m.tabId === activeTabId);
  const member = filteredMembers.find(m => m.Name === oldName);

  if (!member) {
    showNotification("Member not found", "error");
    return;
  }

  // Show input dialog for new name
  const newName = prompt(`Change name for "${oldName}":`, oldName);

  if (!newName || newName.trim() === "" || newName === oldName) {
    return; // User cancelled or entered same name
  }

  const trimmedNewName = newName.trim();

  // Validate name length
  if (trimmedNewName.length < 2) {
    showNotification("Member name must be at least 2 characters", "error");
    return;
  }

  // Check if name already exists in current tab
  const nameExists = filteredMembers.some(m =>
    m.Name === trimmedNewName && m.id !== member.id
  );

  if (nameExists) {
    showNotification(`Member "${trimmedNewName}" already exists in this tab`, "error");
    return;
  }

  try {
    // Update member name in the database
    member.Name = trimmedNewName;

    // Also update all payments associated with this member
    payments.forEach(payment => {
      if (payment.name === oldName && payment.tabId === activeTabId) {
        payment.name = trimmedNewName;
      }
    });

    // Save to Firestore
    await saveData();

    // Re-render UI to reflect changes
    renderTableV2();
    renderHistory();
    populateMemberSelect(members.filter(m => m.tabId === activeTabId));

    showNotification(`Name changed from "${oldName}" to "${trimmedNewName}"`, "success");

  } catch (error) {
    handleError(error, "Update member name");
    // Revert changes on error
    member.Name = oldName;
    payments.forEach(payment => {
      if (payment.name === trimmedNewName && payment.tabId === activeTabId) {
        payment.name = oldName;
      }
    });
  }
}

// Handle amount clicks (NEW - custom amount editing)
document.addEventListener("click", async (e) => {
  const amountSpan = e.target.closest(".amount-display");

  if (amountSpan) {
    e.preventDefault();
    e.stopPropagation();

    const memberId = amountSpan.dataset.memberId;
    await handleAmountEdit(memberId);
    return;
  }
});

// Amount editing function
async function handleAmountEdit(memberId) {
  const member = members.find(m => m.id === memberId && m.tabId === activeTabId);
  if (!member) {
    showNotification("Member not found", "error");
    return;
  }

  const tabDefault = tabDefaultAmounts[activeTabId] || DEFAULT_REQUIRED_AMOUNT;
  const currentAmount = member.requiredAmount || tabDefault;

  const newAmount = prompt(
    `Set custom amount for ${member.Name}:\n\n` +
    `Current: ₱${currentAmount}\n` +
    `Tab default: ₱${tabDefault}\n` +
    `Global default: ₱${DEFAULT_REQUIRED_AMOUNT}\n\n` +
    `Enter new amount or leave blank to use tab default:`,
    member.requiredAmount || ''
  );

  if (newAmount === null) return; // User cancelled

  let finalAmount;
  let action;

  if (newAmount.trim() === "") {
    // Reset to tab default (remove custom amount)
    delete member.requiredAmount;
    finalAmount = tabDefault;
    action = "reset to tab default";
  } else {
    // Validate and set custom amount
    const parsedAmount = parseFloat(newAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showNotification("Please enter a valid positive amount", "error");
      return;
    }
    member.requiredAmount = parsedAmount;
    finalAmount = parsedAmount;
    action = "updated";
  }

  try {
    await saveData();
    renderTableV2();
    renderHistory();

    showNotification(`Amount for ${member.Name} ${action} to ₱${finalAmount}`, "success");

  } catch (error) {
    handleError(error, "Update amount");
  }
}





// Delete confirmation function
async function handleMemberDelete(nameSpan) {
  const memberName = nameSpan.textContent.trim();

  // Find the member in the current tab
  const filteredMembers = members.filter(m => m.tabId === activeTabId);
  const member = filteredMembers.find(m => m.Name === memberName);

  if (!member) {
    showNotification("Member not found", "error");
    return;
  }

  // Check if member has any payments
  const memberPayments = payments.filter(p => p.name === memberName && p.tabId === activeTabId);
  const hasPayments = memberPayments.length > 0;

  let confirmationMessage = `Are you sure you want to delete member "${memberName}"?`;
  if (hasPayments) {
    confirmationMessage += `\n\n⚠️ This will also delete ${memberPayments.length} associated payment(s) totaling ₱${memberPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}.`;
  }

  if (!confirm(confirmationMessage)) {
    return;
  }

  try {
    // Delete member
    members = members.filter(m => !(m.Name === memberName && m.tabId === activeTabId));

    // Delete associated payments
    payments = payments.filter(p => !(p.name === memberName && p.tabId === activeTabId));

    // Save to Firestore
    await saveData();

    // Re-render UI
    renderTableV2();
    renderHistory();
    populateMemberSelect(members.filter(m => m.tabId === activeTabId));

    showNotification(`Member "${memberName}" and ${hasPayments ? 'their payments ' : ''}deleted successfully`, 'success');

  } catch (error) {
    handleError(error, "Delete member");
  }
}


///////////////////////////////////////

function updateSummary(totalCollected, totalRequired) {
  console.log("updateSummary");
  const totalOutstanding = Math.max(0, totalRequired - totalCollected);
  document.getElementById("total-collected").textContent = formatCurrency(totalCollected);
  document.getElementById("total-outstanding").textContent = formatCurrency(totalOutstanding);
  updateChart(totalCollected, totalOutstanding);
}

function updateChart(collected, outstanding) {
  console.log("updateChart");
  const chartCanvas = document.getElementById("overall-progress-chart");
  if (!chartCanvas) return;

  const ctx = chartCanvas.getContext("2d");
  if (chart) {
    chart.destroy();
    chart = null;
  }

  // ✅ Don't render chart if both values are 0
  if (collected === 0 && outstanding === 0) {
    ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
    return;
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
    options: { responsive: true, plugins: { legend: { position: "bottom" } } }
  });
}

function renderHistory() {
  console.log("renderHistory");
  const tbody = document.getElementById("payment-log-body"); tbody.innerHTML = "";
  const filteredMembers = members.filter(m => m.tabId === activeTabId);
  const filteredPayments = payments.filter(p => filteredMembers.some(m => m.Name === p.name));
  if (!filteredPayments.length) { tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-500">No payments recorded for this tab</td></tr>'; return; }

  filteredPayments.forEach(payment => {
    const tr = document.createElement("tr"); tr.className = "border-b hover:bg-gray-50";
    tr.innerHTML = `
        <td class="px-4 py-3 font-medium text-left">${payment.name}</td>
        <td class="px-4 py-3 text-right">${formatCurrency(payment.amount)}</td>
        <td class="px-4 py-3 text-sm text-left">${formatDate(payment.timestamp)}</td>
        <td class="px-4 py-3 text-center flex gap-2 justify-center">
            <button data-id="${payment.id}" class="update-btn text-blue-600 hover:text-blue-800 hover:underline text-sm">Update</button>
            <button data-id="${payment.id}" class="delete-btn text-red-600 hover:text-red-800 hover:underline text-sm">Delete</button>
        </td>
      `;
    tbody.appendChild(tr);
  });

  // Add button handlers
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.onclick = e => {
      if (confirm("Are you sure you want to delete this payment?")) {
        payments = payments.filter(p => p.id !== e.target.dataset.id);
        saveData(); renderHistory(); renderTableV2(); showNotification("Payment deleted successfully", "success");
      }
    };
  });
  document.querySelectorAll(".update-btn").forEach(btn => {
    btn.onclick = e => {
      const newAmount = prompt("Enter new payment amount:");
      if (!newAmount || isNaN(parseFloat(newAmount))) return;
      payments = payments.map(p => p.id === e.target.dataset.id ? { ...p, amount: parseFloat(newAmount), timestamp: Date.now() } : p);
      saveData(); renderHistory(); renderTableV2(); showNotification("Payment updated successfully", "success");
    };
  });
}

function updateUI(user) {
  console.log("updateUI");
  if (!user || user.isAnonymous) {
    window.location.href = "LandingPage.html";
    return;
  }
  currentUser = { email: user.email };
}


document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded");
  const auth = getAuth(app);

  onAuthStateChanged(auth, async (user) => {
    if (!user || user.isAnonymous) {
      window.location.href = "LandingPage.html";
      return;
    }

    // Keep the Firebase user object as currentUser for firestore uses
    currentUser = user;
    activeTabId = null;
    // Update minimal UI info
    updateUI(user);


    await loadData();
    renderTabsToUI();
    checkHiddenSections();

    if (activeTabId) {
      const filteredQuickInfo = quickInfoData.filter(qi => qi.tabId === activeTabId);
      renderQuickInfo(filteredQuickInfo);
    }


    // rest of your UI hookups
    document.querySelector("[data-open-info]").addEventListener("click", () =>
      document.getElementById("info-modal").classList.remove("hidden")
    );
    document.querySelector("[data-close-info]").addEventListener("click", () =>
      document.getElementById("info-modal").classList.add("hidden")
    );

    // Signal that app is ready - loading screen will handle the animation
    window.dispatchEvent(new Event('app-ready'));
  });
});


document.getElementById("payment-form").querySelector('button[type="add-member"]').addEventListener("click", async (e) => {
  e.preventDefault();

  if (!activeTabId) {
    showNotification('Please SELECT or ADD a tab before adding a member', 'error');
    return;
  }

  const nameSelect = document.getElementById("name-select");
  const newMemberName = prompt("Enter new member's name:").trim();
  if (!newMemberName || newMemberName.length < 2) {
    showNotification('Member name must be at least 2 characters', 'error');
    return;
  }

  const addMemberBtn = e.target;
  addMemberBtn.disabled = true;
  addMemberBtn.textContent = 'Adding...';
  try {
    const tabDefault = tabDefaultAmounts[activeTabId] || DEFAULT_REQUIRED_AMOUNT;

    members.push({
      Name: newMemberName,
      id: `member${Date.now()}`,
      timestamp: Date.now(),
      addedBy: currentUser.email,
      tabId: activeTabId,
      requiredAmount: null // Start with tab default, not custom
    });

    await saveData();
    populateMemberSelect(members.filter(m => m.tabId === activeTabId));
    nameSelect.value = newMemberName;
    renderTableV2();
    showNotification(`Member ${newMemberName} added successfully with default amount ₱${tabDefault}`, 'success');
  } catch (error) {
    handleError(error, 'Add member');
  } finally {
    addMemberBtn.disabled = false;
    addMemberBtn.textContent = 'Add Member';
  }
});

// Add payment
document.getElementById("payment-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name-select").value;
  const amount = parseFloat(document.getElementById("amount-input").value);
  if (!name || isNaN(amount) || amount <= 0) {
    showNotification('Please select a member and enter a valid amount', 'error');
    return;
  }

  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';
  try {
    payments.push({
      id: `payment${Date.now()}`,
      name,
      amount,
      timestamp: Date.now(),
      tabId: activeTabId   // ✅ FIX
    });

    await saveData();
    renderHistory();
    renderTableV2();
    showNotification('Payment added successfully', 'success');
    e.target.reset();
  } catch (error) {
    handleError(error, 'Add payment');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add Payment';
  }
});

const tabsContainer = document.getElementById("tabs");
const addTabBtn = document.getElementById("add-tab-btn");

async function deleteTabDocument(docId) {
  console.log("deleteTabDocument");
  if (!docId) return;
  try {
    // Use the exact docId stored in tabs[].id
    await deleteDoc(doc(db, "members", docId));
    console.log("Deleted Firestore doc:", docId);

    return true;
  } catch (err) {
    console.error("Failed to delete Firestore doc:", docId, err);
    showNotification("Failed to delete tab document. Check console.", "error");
    return false;
  }
}

function checkTabLimit() {
  console.log("checkTabLimit");
  const tabsElements = tabsContainer.querySelectorAll(".tab");
  if (tabsElements.length === 5) {
    tabsContainer.classList.add("tabs-stretch");
  } else {
    tabsContainer.classList.remove("tabs-stretch");
  }
  if (tabsElements.length >= MAX_TABS) {
    if (addTabBtn) addTabBtn.style.display = "none";
    return false;
  } else {
    if (addTabBtn) addTabBtn.style.display = "inline-flex";
    return true;
  }
}

addTabBtn.addEventListener("click", async () => {
  if (!checkTabLimit()) {
    alert(`⚠️ You can only have up to ${MAX_TABS} tabs.`);
    return;
  }

  // Create custom dialog for tab creation
  const tabName = prompt("Enter tab name:");
  if (!tabName) return;

  // Ask for default amount
  const defaultAmountInput = prompt(
    `Enter default amount per member for "${tabName}":\n\n` +
    `Current global default: ₱${DEFAULT_REQUIRED_AMOUNT}`,
    DEFAULT_REQUIRED_AMOUNT
  );

  if (defaultAmountInput === null) return; // User cancelled

  let defaultAmount;
  if (defaultAmountInput.trim() === "") {
    defaultAmount = DEFAULT_REQUIRED_AMOUNT;
  } else {
    const parsedAmount = parseFloat(defaultAmountInput);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showNotification("Please enter a valid positive amount", "error");
      return;
    }
    defaultAmount = parsedAmount;
  }

  // ✅ Disable button immediately to prevent double clicks
  addTabBtn.disabled = true;
  addTabBtn.style.opacity = "0.5";
  addTabBtn.style.cursor = "not-allowed";

  try {
    const newTab = {
      tabName: tabName,
      tabsArrangement: tabs.length + 1,
      tabsBy: currentUser.email,
      id: `tab${Date.now()}`
    };

    tabs.push(newTab);
    await createTab(tabName, null, defaultAmount); // Pass default amount
    showNotification(`Tab "${tabName}" created with default amount ₱${defaultAmount}`, 'success');
  } catch (err) {
    handleError(err, "Add tab");
  } finally {
    // ✅ Re-enable the button after work is done
    addTabBtn.disabled = false;
    addTabBtn.style.opacity = "1";
    addTabBtn.style.cursor = "pointer";
    checkTabLimit(); // Recheck tab count to hide button if at max
  }
});

document.getElementById("total-collected").textContent = "₱0";
document.getElementById("total-outstanding").textContent = "₱0";
updateChart(0, 0);

function getUID() {
  console.log("getUID");
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);

  const randomPart = Array.from(bytes)
    .map(b => b.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, 16);

  return `${randomPart}@GPT`;
}



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


async function createTab(name = "New Tab", docId = null, defaultAmount = DEFAULT_REQUIRED_AMOUNT) {
  console.log("createTab");
  // If docId is not provided, create a new Firestore document for this tab
  if (!docId) {
    if (!currentUser || !currentUser.email) {
      showNotification("You must be signed in to create a tab", "error");
      return;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${year}${month}${day}${hours}:${minutes}`;

    docId = `${currentUser.email}TAB${name}--v${timestamp}`;

    tabDefaultAmounts[docId] = defaultAmount;

    const protectedQuickInfoId = `protected_default_amount_${docId}`;
    // In createTab function, when creating the initial Quick Info:
    quickInfoData.push({
      label: "Default amount per member:",
      value: `₱${defaultAmount}`,
      id: protectedQuickInfoId,
      tabId: docId,
      isProtected: true,
      isConstantLabel: true  // This makes the label constant
    });

    const initialBlob = encodeData({
      members: [],
      payments: [],
      tabs: [],
      quickInfo: [{
        label: "Default amount per member:",
        value: `₱${defaultAmount}`,
        id: protectedQuickInfoId,
        isProtected: true,
        isConstantLabel: true
      }],
      tabDefaultAmounts: { [docId]: defaultAmount }
    });

    await setDoc(doc(db, "members", docId), {
      blob_data: initialBlob,
      uid: getUID(),
      tabName: name,
      user: currentUser.email
    });
  }

  // Create tab object in local tabs array (if not already).    
  if (!tabs.some(t => t.id === docId)) {
    tabs.push({
      tabName: name,
      tabsArrangement: tabs.length + 1,
      tabsBy: currentUser ? currentUser.email : "unknown",
      id: docId
    });
  }

  // DOM: create the tab element
  const tab = document.createElement("div");
  tab.className = "tab flex items-center";
  tab.dataset.docId = docId;
  tab.innerHTML = `
      <span>${name}</span>
      <button class="tab-close text-red-600 font-bold ml-4">&times;</button>
    `;

  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    activeTabId = docId;

    // Show UID for this tab
    const foundTab = tabs.find(t => t.id === activeTabId);
    const span = document.getElementById("payment-uid");
    if (foundTab && foundTab.uid) {
      reyalAydi = foundTab.uid;
      window.reyalAydi = foundTab.uid; // Expose globally for QR code
      span.textContent = maskUID(foundTab.uid);
    }

    // Filter data for current tab
    const filteredMembers = members.filter(m => m.tabId === activeTabId);
    const filteredPayments = payments.filter(p => p.tabId === activeTabId);
    const filteredQuickInfo = quickInfoData.filter(qi => qi.tabId === activeTabId);

    // Update UI with filtered data
    populateMemberSelect(filteredMembers);
    renderTableV2();
    renderHistory();
    renderQuickInfo(filteredQuickInfo);
    UIState();
  });

  tab.querySelector(".tab-close").addEventListener("click", async (e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this tab?")) return;

    const tabDocId = tab.dataset.docId;

    // Attempt Firestore deletion
    const deleted = await deleteTabDocument(tabDocId);
    if (!deleted) return;

    // 🧹 Remove from local state
    tabs = tabs.filter(t => t.id !== tabDocId);
    members = members.filter(m => m.tabId !== tabDocId);
    payments = payments.filter(p => p.tabId !== tabDocId);

    // Remove tab default amount and protected quick info
    delete tabDefaultAmounts[tabDocId];
    quickInfoData = quickInfoData.filter(qi => !(qi.tabId === tabDocId && qi.isProtected));

    // 🧱 Remove tab from DOM
    tab.remove();

    const newActive = tabs[0];
    activeTabId = newActive?.id || null;
    if (activeTabId) {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelector(`.tab[data-doc-id="${activeTabId}"]`)?.classList.add("active");
    }

    // 🔁 Update dependent UI
    populateMemberSelect(members.filter(m => m.tabId === activeTabId));
    renderTableV2();
    renderHistory();
    UIState();
    checkTabLimit();

    showNotification("Tab deleted successfully", "success");
  });

  tabsContainer.insertBefore(tab, addTabBtn);
  if (docId === activeTabId) tab.classList.add("active");

  tab.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", tab.id);
    tab.classList.add("opacity-50");
  });
  tab.addEventListener("dragend", () => {
    tab.classList.remove("opacity-50");
  });

  tabsContainer.insertBefore(tab, addTabBtn);
  checkTabLimit();
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function extractTabName(docId) {
  console.log("extractTabName");
  const parts = docId.split("TAB");
  if (parts.length < 2) return { ownerEmail: null, tabName: "Untitled Tab" };
  const [ownerEmail, rest] = parts;
  const tabName = rest.split("--v")[0];
  return { ownerEmail, tabName };
}

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('info-modal');
  const openButtons = document.querySelectorAll('[data-open-info]');
  const closeButtons = document.querySelectorAll('[data-close-info]');

  // Open modal
  openButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent any default behavior (e.g., anchor scroll)
      modal.classList.remove('hidden');
      document.body.classList.add('modal-open');
      // Optional: Scroll modal into view if needed (rarely required for fixed)
      modal.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  // Close modal
  closeButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('hidden');
      document.body.classList.remove('modal-open');
    });
  });

  // Close on overlay click (outside the card)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
      document.body.classList.remove('modal-open');
    }
  });

  // Optional: Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      modal.classList.add('hidden');
      document.body.classList.remove('modal-open');
    }
  });
});


document.addEventListener("DOMContentLoaded", () => {
  const copyBtn = document.getElementById("copy-uid-btn");
  const uidSpan = document.getElementById("payment-uid");

  if (copyBtn && uidSpan) {
    copyBtn.addEventListener("click", async () => {
      if (!reyalAydi) {
        alert("❌ No UID to copy.");
        return;
      }
      try {
        await navigator.clipboard.writeText(reyalAydi);

        // Optional: Give user feedback
        copyBtn.innerHTML = '<span class="material-symbols-outlined text-green-600">check</span>';
        setTimeout(() => {
          copyBtn.innerHTML = '<span class="material-symbols-outlined">content_copy</span>';
        }, 1500);
      } catch (err) {
        console.error("Failed to copy UID:", err);
        alert("❌ Failed to copy UID.");
      }
    });
  }
});


function maskUID(uid) {
  if (!uid || uid.length < 7) return "- UID IS MASKED TO PREVENT UNAUTHORIZED ACCESS -";
  return uid.slice(0, 3) + " - UID IS MASKED TO PREVENT UNAUTHORIZED ACCESS - " + uid.slice(-6);
}

document.getElementById("total-collected").textContent = "₱0";
document.getElementById("total-outstanding").textContent = "₱0";
updateChart(0, 0);


function renderTabsToUI() {
  console.log("renderTabsToUI");
  const tabsWrapper = document.getElementById("tabs");
  if (!tabsWrapper) return;

  tabsWrapper.querySelectorAll(".tab").forEach(t => t.remove());

  tabs.forEach(tab => {
    if (!tabDefaultAmounts[tab.id]) {
      tabDefaultAmounts[tab.id] = DEFAULT_REQUIRED_AMOUNT;
    }
    const tabEl = document.createElement("div");
    tabEl.className = "tab flex items-center";
    tabEl.dataset.docId = tab.id;
    tabEl.innerHTML = `
        <span>${tab.tabName || "Untitled Tab"}</span>
        <button class="tab-close text-red-600 font-bold ml-4">&times;</button>
      `;


    // In your tab click handler, add this:
    tabEl.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      tabEl.classList.add("active");
      activeTabId = tab.id;

      // Show UID for this tab
      const foundTab = tabs.find(t => t.id === activeTabId);
      const span = document.getElementById("payment-uid");
      if (foundTab && foundTab.uid) {
        reyalAydi = foundTab.uid;
        window.reyalAydi = foundTab.uid; // Expose globally for QR code
        span.textContent = maskUID(foundTab.uid);
      }

      // Filter data for current tab
      const filteredMembers = members.filter(m => m.tabId === activeTabId);
      const filteredPayments = payments.filter(p => p.tabId === activeTabId);
      const filteredQuickInfo = quickInfoData.filter(qi => qi.tabId === activeTabId);

      // Update UI with filtered data
      populateMemberSelect(filteredMembers);
      renderTableV2();
      renderHistory();
      renderQuickInfo(filteredQuickInfo);
      UIState(); // Ensure UI state is updated
    });



    // New function to render quick info for current tab


    tabEl.querySelector(".tab-close").addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm("Are you sure you want to delete this tab?")) return;
      const deleted = await deleteTabDocument(tab.id);
      if (!deleted) return;

      tabs = tabs.filter(t => t.id !== tab.id);
      members = members.filter(m => m.tabId !== tab.id);
      payments = payments.filter(p => p.tabId !== tab.id);

      tabEl.remove();
      activeTabId = tabs[0]?.id || null;
      if (activeTabId) {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        document.querySelector(`.tab[data-doc-id="${activeTabId}"]`)?.classList.add("active");
      }

      populateMemberSelect(members.filter(m => m.tabId === activeTabId));
      renderTableV2();
      renderHistory();
      UIState();
      checkTabLimit();
      showNotification("Tab deleted successfully", "success");
    });

    const addBtn = document.getElementById("add-tab-btn");
    tabsWrapper.insertBefore(tabEl, addBtn);
  });

  checkTabLimit();

  if (tabs.length === 0) {
    // No tabs exist
    activeTabId = null;
    UIState();
    return;
  }

  activeTabId = tabs[0].id;
  // ✅ select first tab
  populateMemberSelect(members.filter(m => m.tabId === activeTabId));
  renderTableV2();
  renderHistory();

}

// Update the renderQuickInfo function to include all properties
function renderQuickInfo(quickInfoItems) {
  const infoContent = document.getElementById("info-content");
  if (!infoContent) return;

  infoContent.innerHTML = '';

  if (quickInfoItems && quickInfoItems.length > 0) {
    quickInfoItems.forEach(item => {
      addQuickInfoRowToUI(
        item.label,
        item.value,
        item.id,
        item.isProtected || false,
        item.isConstantLabel || false  // Add this line
      );
    });
  }
}








async function loadData() {
  console.log("loadData");
  if (!currentUser) return;

  try {
    const tabsRef = collection(db, "members");
    const snapshot = await getDocs(tabsRef);

    tabs = []; // reset tabs
    members = []; // reset global arrays
    payments = [];
    quickInfoData = []; // reset quick info
    tabDefaultAmounts = {}; // reset tab defaults
    let count = 0;

    snapshot.forEach((docSnap) => {
      const { ownerEmail, tabName } = extractTabName(docSnap.id);

      if (ownerEmail === currentUser.email) {
        if (count >= MAX_TABS) return;

        const data = docSnap.data();
        const decoded = decodeData(data.blob_data || "{}") || {};

        // In loadData function:
        if (decoded.members) {
          decoded.members.forEach(m => {
            members.push({
              ...m,
              tabId: m.tabId || docSnap.id,
              preservedAtOldAmount: m.preservedAtOldAmount || false // Load preservation flag
            });
          });
        }

        if (decoded.payments) {
          decoded.payments.forEach(p => {
            payments.push({
              ...p,
              tabId: p.tabId || docSnap.id
            });
          });
        }

        // In the loadData function, inside the snapshot.forEach loop:
        // In the loadData function, inside the snapshot.forEach loop:
        if (decoded.quickInfo) {
          decoded.quickInfo.forEach(qi => {
            quickInfoData.push({
              ...qi,
              tabId: qi.tabId || docSnap.id,
              isProtected: qi.isProtected || false,
              isConstantLabel: qi.isConstantLabel || false // Ensure this is set
            });
          });
        }

        // Load tab default amounts
        if (decoded.tabDefaultAmounts) {
          Object.assign(tabDefaultAmounts, decoded.tabDefaultAmounts);
        }

        const tabObj = {
          id: docSnap.id,
          tabName: tabName || (data.tabName || "Untitled Tab"),
          uid: data.uid || null,
          user: data.user || ownerEmail,
          ...decoded
        };

        tabs.push(tabObj);
        count++;
      }
    });

    console.log("Loaded:", tabs.length, "tabs,", members.length, "members,", payments.length, "payments,", quickInfoData.length, "quick info items");

    activeTabId = null;
    renderTabsToUI();

  } catch (err) {
    console.error("Failed to load tabs:", err);
    handleError(err, "Load data (Firestore)");
  }
}

// Old modal form code - now handled by quickInfoModal.js
// modalForm.addEventListener("submit", async (e) => {
//   ... moved to quickInfoModal.js
// });






// Load quick info from decoded blob
function loadQuickInfo() {
  const infoContent = document.getElementById("info-content");
  if (!infoContent) return;

  infoContent.innerHTML = '';

  if (quickInfoData && quickInfoData.length > 0) {
    quickInfoData.forEach(item => {
      addQuickInfoRowToUI(item.label, item.value);
    });
  }
}

// Add quick info row to UI only
async function addQuickInfo(label, value) {
  if (!activeTabId) {
    showNotification("Please select a tab first", "error");
    return false;
  }

  const qiId = `qi_${Date.now()}`;

  // Add to global quickInfoData
  quickInfoData.push({
    label: label.trim(),
    value: value.trim(),
    id: qiId,
    tabId: activeTabId,
    isProtected: false,
    isConstantLabel: false
  });

  // Save to Firestore blob
  await saveData();

  // Update UI - pass all parameters
  addQuickInfoRowToUI(label, value, qiId, false, false);

  showNotification("Quick info added successfully", "success");
  return true;
}

// Expose addQuickInfo to non-module scripts (quickInfoModal.js)
try {
  window.addQuickInfo = addQuickInfo;
} catch (e) {
  // ignore if window is not writable for any reason
}

// Update a quick info item and persist
async function updateQuickInfoItem(id, newLabel, newValue) {
  try {
    const qi = quickInfoData.find(q => q.id === id && q.tabId === activeTabId);
    if (!qi) {
      showNotification('Quick info item not found', 'error');
      return false;
    }

    qi.label = (newLabel || qi.label).toString().trim();
    qi.value = (newValue || qi.value).toString().trim();

    await saveData();

    const filteredQuickInfo = quickInfoData.filter(q => q.tabId === activeTabId);
    renderQuickInfo(filteredQuickInfo);
    showNotification('Quick info updated', 'success');
    return true;
  } catch (err) {
    handleError(err, 'Update quick info');
    return false;
  }
}

// Delete a quick info item and persist
async function deleteQuickInfoItem(id) {
  try {
    const before = quickInfoData.length;
    quickInfoData = quickInfoData.filter(q => !(q.id === id && q.tabId === activeTabId));
    if (quickInfoData.length === before) {
      showNotification('Quick info item not found', 'error');
      return false;
    }

    await saveData();

    const filteredQuickInfo = quickInfoData.filter(q => q.tabId === activeTabId);
    renderQuickInfo(filteredQuickInfo);
    showNotification('Quick info deleted', 'success');
    return true;
  } catch (err) {
    handleError(err, 'Delete quick info');
    return false;
  }
}

try { window.updateQuickInfoItem = updateQuickInfoItem; } catch (e) {}
try { window.deleteQuickInfoItem = deleteQuickInfoItem; } catch (e) {}


function addQuickInfoRowToUI(label, value, id = `qi_${Date.now()}`, isProtected = false, isConstantLabel = false) {
  const infoContent = document.getElementById("info-content");
  const newRow = document.createElement("div");
  newRow.className = "info-row group relative";
  newRow.dataset.qiId = id;
  newRow.dataset.isProtected = isProtected;
  newRow.dataset.constantLabel = isConstantLabel;

  if (isProtected || isConstantLabel) {
    newRow.innerHTML = `
      <div class="flex-1">
        <span class="info-label text-gray-600 font-semibold constant-label">${label}</span>
      </div>
      <div class="flex-1 text-right">
        <span class="info-value qi-editable text-blue-600 font-bold" data-type="value" data-protected="true">${value}</span>
      </div>
    `;
  } else {
    newRow.innerHTML = `
      <div class="flex-1">
        <span class="info-label qi-editable" title="Click to rename • Double-click to delete" data-type="label">${label}</span>
      </div>
      <div class="flex-1 text-right">
        <span class="info-value qi-editable" title="Click to rename • Double-click to delete" data-type="value">${value}</span>
      </div>
    `;
  }

  infoContent.appendChild(newRow);

  // Event listeners for editable elements are now handled by quickInfoModal.js
}

// Add edit/delete functionality to Quick Info rows
// Quick Info edit/delete functionality moved to quickInfoModal.js
// This section is now handled by the QuickInfoModal class


// Handle protected default amount editing
// Handle protected default amount editing with member selection
// Handle protected default amount editing with member selection - CORRECTED VERSION
async function handleProtectedAmountEdit(id, label, currentValue) {
  const quickInfoItem = quickInfoData.find(qi => qi.id === id && qi.tabId === activeTabId);
  if (!quickInfoItem) {
    showNotification("Quick Info item not found", "error");
    return;
  }

  // Extract current amount value (remove ₱ symbol and any formatting)
  const currentAmountValue = currentValue.replace('₱', '').replace(/,/g, '');

  const newAmount = prompt(
    `Edit default amount for all members in this tab:\n\n` +
    `This will affect members using the tab default amount.\n\n` +
    `Current default: ₱${currentAmountValue}`,
    currentAmountValue
  );

  if (newAmount === null) return; // User cancelled

  if (newAmount.trim() === "") {
    showNotification("Default amount cannot be empty", "error");
    return;
  }

  const parsedAmount = parseFloat(newAmount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    showNotification("Please enter a valid positive amount", "error");
    return;
  }

  // Get members using tab default (not custom amounts)
  const membersUsingDefault = members.filter(member =>
    member.tabId === activeTabId && !member.requiredAmount
  );

  if (membersUsingDefault.length === 0) {
    // No members using default, just update the tab default
    await updateTabDefaultAmount(parsedAmount, quickInfoItem, { memberIds: [], option: 'future' });
    return;
  }

  // Ask user how to apply the change
  const selectionResult = await showMemberSelectionDialog(membersUsingDefault, parsedAmount, currentAmountValue);

  if (selectionResult === null) return; // User cancelled

  await updateTabDefaultAmount(parsedAmount, quickInfoItem, selectionResult);
}




// Update tab default amount and apply to selected members
// Update tab default amount and apply to selected members
// Enhanced update function with preservation tracking
// Update tab default amount and apply to selected members - FIXED VERSION
async function updateTabDefaultAmount(newAmount, quickInfoItem, selectionResult) {
  try {
    const oldAmount = tabDefaultAmounts[activeTabId];
    tabDefaultAmounts[activeTabId] = newAmount;
    quickInfoItem.value = `₱${newAmount.toLocaleString()}`;

    let updatedMembersCount = 0;
    let preservedMembersCount = 0;

    const { memberIds: selectedMemberIds, option } = selectionResult;

    if (option === 'all') {
      // Apply to ALL members - set them all to use the new amount
      members.forEach(member => {
        if (member.tabId === activeTabId) {
          member.requiredAmount = newAmount; // Set custom amount to new value
          updatedMembersCount++;
        }
      });
    } else if (option === 'select') {
      // Apply to selected members only
      members.forEach(member => {
        if (selectedMemberIds.includes(member.id)) {
          member.requiredAmount = newAmount; // Set custom amount to new value
          updatedMembersCount++;
        }
      });
    } else if (option === 'default_only') {
      // Apply only to members currently using default
      members.forEach(member => {
        if (selectedMemberIds.includes(member.id) && !member.requiredAmount) {
          // They continue using default (no requiredAmount set)
          updatedMembersCount++;
        }
      });
    } else if (option === 'future') {
      // "Only for NEW members" - preserve existing members
      const membersUsingDefault = members.filter(member =>
        member.tabId === activeTabId && !member.requiredAmount
      );

      membersUsingDefault.forEach(member => {
        // Set requiredAmount to lock them at the OLD amount
        member.requiredAmount = oldAmount;
        preservedMembersCount++;
      });
    }

    await saveData();
    renderTableV2();
    renderHistory();

    const filteredQuickInfo = quickInfoData.filter(qi => qi.tabId === activeTabId);
    renderQuickInfo(filteredQuickInfo);

    let message = `Default amount updated to ₱${newAmount.toLocaleString()}. `;

    if (option === 'all') {
      message += `All ${updatedMembersCount} member(s) updated to ₱${newAmount}.`;
    } else if (option === 'select') {
      message += `${updatedMembersCount} selected member(s) updated to ₱${newAmount}.`;
    } else if (option === 'default_only') {
      message += `${updatedMembersCount} member(s) using default will now use ₱${newAmount}.`;
    } else if (option === 'future') {
      message += `${preservedMembersCount} existing member(s) preserved at ₱${oldAmount}. New members will use ₱${newAmount}.`;
    }

    showNotification(message, "success");

  } catch (error) {
    handleError(error, "Update default amount");
  }
}





// Show member selection dialog with checkboxes - FIXED VERSION
async function showMemberSelectionDialog(membersUsingDefault, newAmount, currentAmount) {
  return new Promise((resolve) => {
    // Get ALL members in the current tab (not just those using default)
    const allMembersInTab = members.filter(member => member.tabId === activeTabId);

    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modalOverlay.innerHTML = `
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold mb-4">Apply New Default Amount</h3>
        
        <div class="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
          <p class="text-sm text-blue-800">
            <strong>Changing:</strong> ₱${currentAmount} → ₱${newAmount}
          </p>
          <p class="text-xs text-blue-600 mt-1">
            ${allMembersInTab.length} total member(s) in this tab
          </p>
        </div>

        <div class="mb-4">
          <p class="text-sm font-medium mb-2">Apply to:</p>
          
          <div class="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded p-3">
            <label class="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
  <input type="radio" name="applyOption" value="all" checked class="rounded text-blue-600">
  <span class="flex-1">
    <span class="font-medium">All members in this tab</span>
    <span class="text-xs text-gray-500 block">(${allMembersInTab.length} members - will update everyone)</span>
  </span>
</label>

            <label class="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
              <input type="radio" name="applyOption" value="select" class="rounded text-blue-600">
              <span class="font-medium">Select specific members</span>
            </label>

<div id="memberCheckboxes" class="ml-6 mt-2 space-y-2 hidden">
  ${allMembersInTab.map(member => {
      const isUsingDefault = !member.requiredAmount;
      const memberCurrentAmount = member.requiredAmount || currentAmount; // Changed variable name
      const icon = isUsingDefault ? '⚙️' : '✏️';

      return `
    <label class="flex items-center space-x-3 p-1 hover:bg-gray-50 rounded cursor-pointer">
      <input type="checkbox" value="${member.id}" class="rounded text-blue-600 member-checkbox" ${isUsingDefault ? 'checked' : ''}>
      <span class="flex items-center gap-2">
        <span class="text-xs">${icon}</span>
        <span>${member.Name}</span>
        <span class="text-xs text-gray-500">(₱${memberCurrentAmount})</span> <!-- Use new variable name -->
      </span>
    </label>
  `}).join('')}
</div>

            <label class="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
              <input type="radio" name="applyOption" value="default_only" class="rounded text-blue-600">
              <span class="flex-1">
                <span class="font-medium">Only members using default</span>
                <span class="text-xs text-gray-500 block">(${membersUsingDefault.length} members with ⚙️ icon)</span>
              </span>
            </label>

            <label class="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
              <input type="radio" name="applyOption" value="future" class="rounded text-blue-600">
              <span class="flex-1">
                <span class="font-medium">Only for NEW members</span>
                <span class="text-xs text-gray-500 block">(Existing members remain unchanged)</span>
              </span>
            </label>
          </div>
        </div>

        <div class="flex justify-end space-x-3">
          <button type="button" id="cancelBtn" class="px-4 py-2 text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button type="button" id="applyBtn" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Apply Changes
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);

    // Add event listeners
    const applyOptionRadios = modalOverlay.querySelectorAll('input[name="applyOption"]');
    const memberCheckboxes = modalOverlay.querySelector('#memberCheckboxes');
    const cancelBtn = modalOverlay.querySelector('#cancelBtn');
    const applyBtn = modalOverlay.querySelector('#applyBtn');

    // Toggle checkboxes visibility
    applyOptionRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.value === 'select') {
          memberCheckboxes.classList.remove('hidden');
        } else {
          memberCheckboxes.classList.add('hidden');
        }
      });
    });

    // Cancel button
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modalOverlay);
      resolve(null);
    });

    // Apply button
    applyBtn.addEventListener('click', () => {
      const selectedOption = modalOverlay.querySelector('input[name="applyOption"]:checked').value;
      let selectedMembers = [];

      if (selectedOption === 'all') {
        // Apply to ALL members
        selectedMembers = allMembersInTab.map(m => m.id);
      } else if (selectedOption === 'select') {
        // Get selected member IDs from checkboxes
        const checkedBoxes = modalOverlay.querySelectorAll('.member-checkbox:checked');
        selectedMembers = Array.from(checkedBoxes).map(cb => cb.value);

        if (selectedMembers.length === 0) {
          showNotification("Please select at least one member", "warning");
          return;
        }
      } else if (selectedOption === 'default_only') {
        // Apply only to members currently using default
        selectedMembers = membersUsingDefault.map(m => m.id);
      } else if (selectedOption === 'future') {
        // Only update tab default, don't change any existing members
        selectedMembers = [];
      }

      document.body.removeChild(modalOverlay);
      resolve({
        memberIds: selectedMembers,
        option: selectedOption
      });
    });

    // Close on overlay click
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        document.body.removeChild(modalOverlay);
        resolve(null);
      }
    });
  });
}




// handleQuickInfoRename and handleQuickInfoDelete moved to quickInfoModal.js



document.addEventListener('DOMContentLoaded', function() {
        // Get the move up button and link
        const moveUpBtn = document.getElementById('moveUpBtn');
        const moveUpLink = document.getElementById('moveUpLink');
        
        // Function to scroll to top smoothly
        function scrollToTop() {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
        
        // Add click event to the move up button
        if (moveUpBtn) {
          moveUpBtn.addEventListener('click', scrollToTop);
        }
        
        // Add click event to the move up link in footer
        if (moveUpLink) {
          moveUpLink.addEventListener('click', function(e) {
            e.preventDefault();
            scrollToTop();
          });
        }
        
        // Show/hide the move up button based on scroll position
        window.addEventListener('scroll', function() {
          if (window.pageYOffset > 300) {
            moveUpBtn.style.display = 'flex';
          } else {
            moveUpBtn.style.display = 'none';
          }
        });
      });
      

// Load on page init (add to your DOMContentLoaded)
document.addEventListener("DOMContentLoaded", loadQuickInfo);