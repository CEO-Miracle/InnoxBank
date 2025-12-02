// index.js
import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  // Helper translation function: uses window.t if available, otherwise returns fallback/key.
  function tr(key, fallback) {
    try {
      if (typeof window.t === "function")
        return window.t(key) || fallback || key;
      const dict = window._innoxDict || {};
      const val = key.split(".").reduce((o, k) => o?.[k], dict);
      return val !== undefined ? val : fallback ?? key;
    } catch {
      return fallback ?? key;
    }
  }

  const mainContent = document.getElementById("mainContent");
  const nameEl = document.getElementById("user-name");
  const balanceEl = document.getElementById("user-balance");
  const profileImg = document.getElementById("profile-image");
  const toggleBtn = document.getElementById("toggle-balance");
  const transactionsTable = document.getElementById("transactionsTable");

  let hidden = false;

  function displayUser(userData) {
    if (nameEl)
      nameEl.textContent = userData?.name ?? tr("nav.dashboard", "User");
    if (balanceEl)
      balanceEl.textContent = `$${Number(
        userData?.balance ?? 0
      ).toLocaleString()}`;
    if (profileImg)
      profileImg.src = userData?.profileImage || "images/avatar.svg";

    try {
      localStorage.setItem("userData", JSON.stringify(userData));
      localStorage.setItem("balance", userData?.balance ?? 0);
    } catch (e) {
      console.warn("index.js: could not write to localStorage", e);
    }
  }

  // 🔹 Only change: Force status to "Success" or "Failed"
  function loadRecentTransactions(transactions) {
    if (!transactionsTable) return;
    transactionsTable.innerHTML = "";

    transactions.forEach((tx) => {
      const trEl = document.createElement("tr");

      const statusLabel = tx.status?.toLowerCase().includes("success")
        ? "Success"
        : "Failed";

      trEl.innerHTML = `
        <td>${tx.date}</td>
        <td>${tx.description}</td>
        <td>$${Number(tx.amount).toLocaleString()}</td>
        <td class="${statusLabel === "Success" ? "success" : "failed"}">
          ${statusLabel}
        </td>
      `;

      trEl.addEventListener("click", () => {
        try {
          localStorage.setItem("transaction-details", JSON.stringify(tx));
        } catch (e) {
          console.warn("index.js: could not store transaction-details", e);
        }
        window.location.href = "t-details.html";
      });

      transactionsTable.appendChild(trEl);
    });
  }

  if (toggleBtn && balanceEl) {
    toggleBtn.addEventListener("click", () => {
      hidden = !hidden;
      if (hidden) {
        balanceEl.textContent = "•••••••";
        toggleBtn.textContent = "🙈";
      } else {
        const bal = Number(localStorage.getItem("balance") || 0);
        balanceEl.textContent = `$${bal.toLocaleString()}`;
        toggleBtn.textContent = "👁️";
      }
    });
  }

  const recentTransactions = [
    {
      date: "2025-11-01 09:20",
      description: tr("transactions.refund", "Innox Bank Refund"),
      amount: 18000,
      status: "Success",
    },
    {
      date: "2025-11-05 12:30",
      description: tr("transactions.airtime_purchase", "Airtime Purchase"),
      amount: 1500,
      status: "Success",
    },
    {
      date: "2025-11-06 16:05",
      description: tr("transactions.jumia_order", "Jumia Order"),
      amount: 23000,
      status: "Failed",
    },
  ];

  if (mainContent) mainContent.style.display = "none";

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      try {
        window.location.href = "signin.html";
      } catch (e) {
        console.error("index.js redirect to signin failed", e);
      }
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await signOut(auth);
        window.location.href = "signin.html";
        return;
      }

      const userData = userSnap.data();

      if (userData.blocked) {
        try {
          await signOut(auth);
        } catch (e) {
          console.warn("index.js: signOut error for blocked user", e);
        }

        try {
          localStorage.removeItem("userData");
          localStorage.removeItem("balance");
        } catch {}

        window.location.href = "blocked.html";
        return;
      }

      displayUser(userData);
      loadRecentTransactions(recentTransactions);

      if (mainContent) mainContent.style.display = "block";
    } catch (err) {
      console.error("index.js error during auth flow:", err);
      try {
        window.location.href = "signin.html";
      } catch (e) {
        console.error("index.js fallback redirect failed", e);
      }
    }
  });
});
