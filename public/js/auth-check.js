import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (user) {
    if (window.location.pathname === "/signin.html") {
      window.location.href = "/index.html";
    }
  } else {
    if (window.location.pathname !== "/signin.html") {
      window.location.href = "/signin.html";
    }
  }
});
