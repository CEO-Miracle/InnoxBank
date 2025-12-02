// userCache.js
import { db } from "./firebase.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

const USER_CACHE_KEY = "userData";

export function getCachedUser() {
  try {
    const cached = localStorage.getItem(USER_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.error("Failed to read cached user:", err);
    return null;
  }
}

export async function fetchUser(uid) {
  if (!uid) return null;

  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    const data = snap.data();
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(data));

    return data;
  } catch (err) {
    console.error("Failed to fetch user:", err);
    return null;
  }
}

export function setCachedUser(userData) {
  localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
}

export function clearUserCache() {
  localStorage.removeItem(USER_CACHE_KEY);
}
