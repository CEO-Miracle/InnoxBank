// user-profile.js
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import {
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

// Elements
const fields = {
  name: document.getElementById("name"),
  username: document.getElementById("username"),
  email: document.getElementById("email"),
  phone: document.getElementById("phone"),
  account: document.getElementById("account"),
  balance: document.getElementById("balance"),
  pin: document.getElementById("pin"),
  joined: document.getElementById("joined"),
  address: document.getElementById("address"),
};
const profileImg = document.getElementById("profile-pic");

// Fetch user data and populate fields
onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "login.html");

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const userData = userSnap.data();

    fields.name.textContent = userData.name ?? "Not set";
    fields.username.textContent = userData.username ?? "Not set";
    fields.email.textContent = userData.email ?? "Not set";
    fields.phone.textContent = userData.phone ?? "Not set";
    fields.account.textContent = userData.accountNumber ?? "Not set";
    fields.balance.textContent = `$${Number(
      userData.balance ?? 0
    ).toLocaleString()}`;
    fields.pin.textContent = userData.pin ?? "Not set";

    // Format timestamp nicely
    const createdAt = userData.createdAt?.toDate
      ? userData.createdAt.toDate()
      : new Date(userData.createdAt);
    fields.joined.textContent = createdAt
      ? createdAt.toLocaleDateString()
      : "Unknown";

    fields.address.textContent = userData.Address ?? "Not set";
    profileImg.src = userData.profileImage?.trim() || "images/avatar.svg";
  }

  // Edit profile
  window.editProfile = async () => {
    const newAddress = prompt("Enter new address:");
    if (!newAddress?.trim()) return;
    await updateDoc(doc(db, "users", user.uid), { Address: newAddress.trim() });
    fields.address.textContent = newAddress.trim();
    alert("Profile updated!");
  };

  // Go back
  window.goBack = () => (window.location.href = "index.html");
});
