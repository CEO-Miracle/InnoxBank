// withdraw.js
import { getCachedUser, fetchUser } from "./userCache.js";
import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "login.html");

  const userData = getCachedUser() || (await fetchUser(user.uid));

  const balanceEl = document.getElementById("user-balance");
  const nameEl = document.getElementById("user-name");
  const profileImg = document.getElementById("profile-image");

  if (userData) {
    balanceEl.textContent = `$${Number(
      userData.balance || 0
    ).toLocaleString()}`;
    nameEl.textContent = userData.name || "User";
    profileImg.src = userData.profileImage || "images/avatar.svg";
  }

  // Further withdraw logic can use userData.balance
});
