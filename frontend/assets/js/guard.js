import { getToken, getUserRole } from "./auth.js";

export function requireAuth() {
  const token = getToken();
  if (!token) window.location.href = "login.html";
}

export function requireRole(roles = []) {
  const role = getUserRole();
  if (!role || !roles.includes(role)) {
    // not allowed
    window.location.href = "courses.html";
  }
}