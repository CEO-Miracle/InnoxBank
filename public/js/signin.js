// signin.js
import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const togglePasswordBtn = document.querySelector(".toggle-password");

// ---------------------------
// ✅ Password toggle
// ---------------------------
if (togglePasswordBtn && passwordInput) {
  togglePasswordBtn.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    togglePasswordBtn.textContent = isHidden ? "Hide" : "Show";
  });
}

// ---------------------------
// ✅ Login form submission
// ---------------------------
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("Please enter your email and password.");
    return;
  }

  try {
    // Sign in with Firebase
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;

    // Fetch user data from Firestore
    const userSnap = await getDoc(doc(db, "users", uid));
    if (!userSnap.exists()) {
      alert("Account not found.");
      return;
    }

    const userData = userSnap.data();

    // Check if user is blocked
    if (userData.blocked) {
      alert("Your account is blocked. Contact Innox Bank.");
      await auth.signOut();
      return;
    }

    // Save user data locally for dashboard
    localStorage.setItem("userData", JSON.stringify(userData));
    localStorage.setItem("balance", userData.balance ?? 0);

    // ✅ Redirect to dashboard
    window.location.href = "index.html";
  } catch (err) {
    console.error(err);
    if (
      err.code === "auth/user-not-found" ||
      err.code === "auth/wrong-password"
    ) {
      alert("Incorrect email or password.");
    } else {
      alert("Login failed. Try again.");
    }
  }
});
