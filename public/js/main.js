import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signInAnonymously, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// Firebase Config
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
const auth = getAuth(app);

// Auth
const authBtn = document.getElementById("auth-btn");
const userIdEl = document.getElementById("user-id");
let currentUser = null;

function updateUI(user) {
  if (user && !user.isAnonymous) {
    currentUser = user;
    userIdEl.textContent = user.email;
    authBtn.textContent = "Sign Out";
    document.getElementById("payment-form-section").classList.remove("hidden");
    document.getElementById("payment-history-section").classList.remove("hidden");
  } else {
    currentUser = null;
    userIdEl.textContent = "Guest";
    authBtn.textContent = "Sign In";
    document.getElementById("payment-form-section").classList.add("hidden");
    document.getElementById("payment-history-section").classList.add("hidden");
  }
}

authBtn.addEventListener("click", async () => {
  if (currentUser) {
    await signOut(auth);
  } else {
    await signInWithPopup(auth, new GoogleAuthProvider());
  }
});

onAuthStateChanged(auth, user => {
  if (!user) signInAnonymously(auth);
  updateUI(user);
  if (user) setupListeners();
});

let chart = null;

// Setup Listeners
async function setupListeners() {
  const membersSnap = await getDocs(collection(db, "members"));
  const members = membersSnap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));
  populateMemberSelect(members);

  const paymentsQuery = query(collection(db, "payments"), orderBy("timestamp", "desc"));
  onSnapshot(paymentsQuery, snap => {
    const payments = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
    renderTable(members, payments);
    renderHistory(payments);
  });
}

// Populate member select
function populateMemberSelect(members) {
  const select = document.getElementById("name-select");
  select.innerHTML = "";
  members.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.Name;
    opt.textContent = m.Name;
    select.appendChild(opt);
  });
}

// Render tracker
function renderTable(members, payments) {
  const tbody = document.getElementById("tracker-body");
  tbody.innerHTML = "";
  let totalCollected = 0;
  let totalOutstanding = 0;
  const requiredAmount = 130;
  const months = ["Sept", "Oct", "Nov", "Dec"];

  members.forEach(m => {
    let row = `<tr class="border-b"><td class="px-3 py-2 font-medium">${m.Name}</td>`;
    let cumulativePaid = 0;
    let cumulativeRequired = 0;

    months.forEach((month, i) => {
      const monthIndex = new Date(`2025-${month}`).getMonth();
      const endOfMonth = new Date(2025, monthIndex + 1, 0);

      payments.filter(p => p.name === m.Name && p.timestamp.toDate() <= endOfMonth)
        .forEach(p => cumulativePaid += p.amount);
      cumulativeRequired += requiredAmount;

      let progress = Math.min(100, (cumulativePaid / cumulativeRequired) * 100);
      const barColor = progress === 100 ? "bg-green-500" : (progress > 0 ? "bg-orange-400" : "bg-red-500");
      const progressText = `${Math.round(progress)}%`;

      row += `
        <td class="px-3 py-2">
          <div class="progress-bar-bg mb-1"><div class="progress-bar ${barColor}" style="width:${progress}%"></div></div>
          <p class="text-xs font-semibold text-center">${progressText}</p>
        </td>`;

      if (i === months.length - 1) {
        totalCollected += cumulativePaid;
        totalOutstanding += (cumulativeRequired - cumulativePaid) > 0 ? (cumulativeRequired - cumulativePaid) + (cumulativeRequired - cumulativePaid > 0 ? 20 : 0) : 0;
      }
    });
    row += "</tr>";
    tbody.innerHTML += row;
  });

  // Recalculate totals
  totalCollected = 0;
  totalOutstanding = 0;
  members.forEach(m => {
    const paymentsForMember = payments.filter(p => p.name === m.Name);
    const cumulativePaid = paymentsForMember.reduce((sum, p) => sum + p.amount, 0);
    const cumulativeRequired = requiredAmount * months.length;
    totalCollected += cumulativePaid;
    totalOutstanding += (cumulativeRequired - cumulativePaid) > 0 ? (cumulativeRequired - cumulativePaid) + 20 : 0;
  });

  // Update summary + chart
  document.getElementById("total-collected").textContent = "₱" + totalCollected;
  document.getElementById("total-outstanding").textContent = "₱" + totalOutstanding;

  const ctx = document.getElementById("overall-progress-chart").getContext("2d");
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Collected", "Outstanding"],
      datasets: [{
        data: [totalCollected, totalOutstanding],
        backgroundColor: ["#22c55e", "#ef4444"]
      }]
    },
    options: {
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

// Render history
function renderHistory(payments) {
  const tbody = document.getElementById("payment-log-body");
  tbody.innerHTML = "";
  payments.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="px-3 py-2">${p.name}</td>
      <td class="px-3 py-2">₱${p.amount}</td>
      <td class="px-3 py-2">${p.timestamp?.toDate().toLocaleString() || ""}</td>
      <td class="px-3 py-2">
        ${currentUser && !currentUser.isAnonymous
          ? `<button data-id="${p.id}" class="delete-btn text-red-600 hover:underline">Delete</button>`
          : `<span class="text-zinc-400">Locked</span>`}
      </td>`;
    tbody.appendChild(tr);
  });

  if (currentUser && !currentUser.isAnonymous) {
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.onclick = async e => await deleteDoc(doc(db, "payments", e.target.dataset.id));
    });
  }
}

// Add payment
document.getElementById("payment-form").addEventListener("submit", async e => {
  e.preventDefault();
  if (!currentUser || currentUser.isAnonymous) return alert("Sign in required");
  const name = document.getElementById("name-select").value;
  const amount = parseFloat(document.getElementById("amount-input").value);
  if (!name || isNaN(amount)) return;
  await addDoc(collection(db, "payments"), {
    name,
    amount,
    timestamp: serverTimestamp()
  });
  e.target.reset();
});
