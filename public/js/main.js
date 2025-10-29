

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { encodeData, decodeData } from "./codec.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, query, where, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";



const sectionToToggle = [
  "monthly-overview-section",
  "payment-summary-section",
  "quick-info-section",
  "payment-form-section",
  "payment-history-section"
];


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

  const footer = document.getElementById('footer');
  if (footer) {
    if (shouldShow) footer.classList.remove('fixfooter');
    else footer.classList.add('fixfooter');
  }

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
    "At least 5 tabs are allowed"
  ];

  const gifId = "empty-state-gif";
  let gifContainer = document.getElementById(gifId);
  const footer = document.getElementById("footer");

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
      <img src="/assets/icons/Collaboration_Animation.gif" 
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

    if (footer) footer.classList.add("fixfooter");
  } else {
    gifContainer.style.opacity = "0";
    stopMessageScroll();
    setTimeout(() => (gifContainer.style.display = "none"), 400);

    if (footer) footer.classList.remove("fixfooter");
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
let members = [];
let payments = [];
let tabs = [];
let activeTabId;
let chart = null;

const REQUIRED_TOTAL_AMOUNT = 400;
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
const debounce = (func, wait) => {
  let timeout;
  return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func(...args), wait); };
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

    const encodedBlob = encodeData({ members, payments, tabs });

    // IMPORTANT: use activeTabId (the tab document id) — do NOT re-generate a new id
    await setDoc(doc(db, "members", activeTabId), {
      blob_data: encodedBlob
    }, { merge: true }); // merge true to avoid overwriting other fields if desired

    showNotification("Data saved to Firestore", "success");
  } catch (error) {
    handleError(error, "Save data (Firestore)");
  }

  console.log("Saving data for tab:", activeTabId, members.length, "members,", payments.length, "payments");
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
    let count = 0;

    snapshot.forEach((docSnap) => {
      // parse doc id to find owner and tabName
      const { ownerEmail, tabName } = extractTabName(docSnap.id);

      // Only include documents owned by the current user
      if (ownerEmail === currentUser.email) {
        if (count >= MAX_TABS) return; // Stop once MAX_TABS are found

        const data = docSnap.data();
        // if blob_data is missing, decodeData should handle gracefully
        const decoded = decodeData(data.blob_data || "{}") || {};

        // Build a tab object (keep decoded content inside tab for reference if you want)
        const tabObj = {
          id: docSnap.id,
          tabName: tabName || (data.tabName || "Untitled Tab"),
          uid: data.uid || null,
          user: data.user || ownerEmail,
          ...decoded // can contain members/payments/tabs if you encode them into blob
        };

        tabs.push(tabObj);

        // Ensure decoded.members/payments are added to the global arrays with tabId set
        if (decoded && Array.isArray(decoded.members)) {
          decoded.members.forEach(m => {
            // ensure each member has tabId
            members.push({
              ...m,
              tabId: m.tabId || docSnap.id
            });
          });
        }

        if (decoded && Array.isArray(decoded.payments)) {
          decoded.payments.forEach(p => {
            payments.push({
              ...p,
              // add a reference so we can filter by tab if needed in future
              tabId: p.tabId || docSnap.id
            });
          });
        }

        count++;
      }
    });

    console.log("Loaded tabs for user:", currentUser.email, tabs, "members:", members.length, "payments:", payments.length);

    activeTabId = null;

    renderTabsToUI();


  } catch (err) {
    console.error("Failed to load tabs:", err);
    handleError(err, "Load data (Firestore)");
  }
}

function calculateMemberProgressV2(memberName, payments) {
  console.log("calculateMemberProgressV2 for", memberName);
  const memberPayments = payments.filter(p => p.name === memberName);
  const totalPaid = memberPayments.reduce((s, p) => s + p.amount, 0);
  const progress = Math.min((totalPaid / REQUIRED_TOTAL_AMOUNT) * 100, 100);
  return {
    progress,
    isPaid: totalPaid >= REQUIRED_TOTAL_AMOUNT,
    totalPaid,
    amountRemaining: Math.max(0, REQUIRED_TOTAL_AMOUNT - totalPaid),
    requiredAmount: REQUIRED_TOTAL_AMOUNT
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
  const filteredPayments = payments.filter(p => p.tabId === activeTabId); // ✅ FIX HERE
  if (!filteredMembers.length) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-gray-500">No members found for this tab | scroll down to add member/s</td></tr>';
    // 🧹 Clear summary + chart when tab has no members
    updateSummary(0, 0);

    
    return;
  }

  let totalCollected = 0, totalRequired = REQUIRED_TOTAL_AMOUNT * filteredMembers.length;

  filteredMembers.forEach(member => {
    const prog = calculateMemberProgressV2(member.Name, filteredPayments);
    totalCollected += prog.totalPaid;
    let barColor = prog.isPaid ? "bg-green-500" : prog.progress > 0 ? "bg-red-500" : "bg-orange-400" ;
    // let statusIndicator = prog.isPaid ? '<p class="text-xs text-center font-bold text-green-600">✓ Fully Paid</p>' : `<p class="text-xs text-center text-red-600">Need: ₱${prog.amountRemaining}</p>`;
    tbody.innerHTML += `
<tr class="border-b hover:bg-gray-50">
  <td class="px-4 py-3 font-medium name-cell transition-all duration-300 relative">
<span class="member-name relative z-10">${member.Name}</span>
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
  <td class="px-4 py-3 text-right">${formatCurrency(prog.totalPaid)} / ${formatCurrency(REQUIRED_TOTAL_AMOUNT)}</td>
</tr>`;
  });

  updateSummary(totalCollected, totalRequired);

 
}

document.getElementById("tracker-body").addEventListener("click", async (e) => {
  const nameSpan = e.target.closest(".member-name");
  if (!nameSpan) return;

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
});

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
        <td class="px-3 py-2 font-medium">${payment.name}</td>
        <td class="px-3 py-2">${formatCurrency(payment.amount)}</td>
        <td class="px-3 py-2 text-sm">${formatDate(payment.timestamp)}</td>
        <td class="px-3 py-2 flex gap-2">
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


    // *** CHANGED: actually load Firestore docs for the signed-in user ***
    await loadData();

    // renderTabsToUI will already be called by loadData, but call again to be safe
    renderTabsToUI();

    // After loading, if no tabs exist -> hide main sections & show empty state
    checkHiddenSections();



    // rest of your UI hookups
    document.querySelector("[data-open-info]").addEventListener("click", () =>
      document.getElementById("info-modal").classList.remove("hidden")
    );
    document.querySelector("[data-close-info]").addEventListener("click", () =>
      document.getElementById("info-modal").classList.add("hidden")
    );

    anime({
      targets: '#loading-screen',
      opacity: [1, 0],
      duration: 600,
      easing: 'easeOutQuad',
      complete: () => document.getElementById('loading-screen').style.display = 'none'
    });
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
    members.push({
      Name: newMemberName,
      id: `member${Date.now()}`,
      timestamp: Date.now(),
      addedBy: currentUser.email,
      tabId: activeTabId // Assign to active tab
    });
    await saveData();
    populateMemberSelect(members.filter(m => m.tabId === activeTabId));
    nameSelect.value = newMemberName;
    renderTableV2();
    showNotification(`Member ${newMemberName} added successfully`, 'success');
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



  const name = prompt("Enter tab name:");
  if (!name) return;

  // ✅ Disable button immediately to prevent double clicks
  addTabBtn.disabled = true;
  addTabBtn.style.opacity = "0.5";
  addTabBtn.style.cursor = "not-allowed";

  try {
    const newTab = {
      tabName: name,
      tabsArrangement: tabs.length + 1,
      tabsBy: currentUser.email,
      id: `tab${Date.now()}`
    };

    tabs.push(newTab);
    await createTab(name); // Firestore doc + UI creation handled here
    showNotification(`Tab "${name}" added successfully`, 'success');
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

async function createTab(name = "New Tab", docId = null) {
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

    // Build the docId exactly as you requested
    docId = `${currentUser.email}TAB${name}--v${timestamp}`;

    // Save an initial document for the tab
    const initialBlob = encodeData({ members: [], payments: [], tabs: [] });
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
populateMemberSelect(members.filter(m => m.tabId === activeTabId));
    renderTableV2();
    renderHistory();


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
    // payments = payments.filter(p => members.some(m => m.Name === p.name && m.tabId === p.tabId));
    // payments = payments.filter(p => members.some(m => m.tabId === p.tabId));
    payments = payments.filter(p => p.tabId !== tabDocId);



    // 🧱 Remove tab from DOM
    tab.remove();

    // 🧩 If there are NO tabs left, hide everything right away

    const newActive = tabs[0];
    activeTabId = newActive.id;
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelector(`.tab[data-doc-id="${activeTabId}"]`)?.classList.add("active");

    // 🔁 Update dependent UI
    populateMemberSelect(members.filter(m => m.tabId === activeTabId));
    renderTableV2();
    renderHistory();
    checkTabLimit();

    showNotification("Tab deleted successfully", "success");
  });



  // Insert tab element into DOM and enforce max tabs visual logic
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

function extractTabName(docId) {
  console.log("extractTabName");
  const parts = docId.split("TAB");
  if (parts.length < 2) return { ownerEmail: null, tabName: "Untitled Tab" };
  const [ownerEmail, rest] = parts;
  const tabName = rest.split("--v")[0];
  return { ownerEmail, tabName };
}


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

  // Remove existing tab elements but keep the add button
  tabsWrapper.querySelectorAll(".tab").forEach(t => t.remove());

  // Rebuild tabs
  tabs.forEach(tab => {
    const tabEl = document.createElement("div");
    tabEl.className = "tab flex items-center";
    tabEl.dataset.docId = tab.id;
    tabEl.innerHTML = `
        <span>${tab.tabName || "Untitled Tab"}</span>
        <button class="tab-close text-red-600 font-bold ml-4">&times;</button>
      `;

    tabEl.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      tabEl.classList.add("active");
      activeTabId = tab.id;


  const foundTab = tabs.find(t => t.id === activeTabId);
  
  const span = document.getElementById("payment-uid");

  if (foundTab && foundTab.uid) {
      reyalAydi = foundTab.uid;
        span.textContent = maskUID(foundTab.uid);
  } else {
    alert("No UID found for this tab.");
  }



      UIState();
      const filteredMembers = members.filter(m => m.tabId === activeTabId);
      const filteredPayments = payments.filter(p => p.tabId === activeTabId);
      populateMemberSelect(filteredMembers);
      renderTableV2(); // this will trigger updateSummary/updateChart()
      renderHistory();
    });

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
