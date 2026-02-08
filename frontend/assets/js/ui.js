import { isLoggedIn, getRole, logout } from "./auth.js";

async function loadPartial(selector, file) {
  const el = document.querySelector(selector);
  if (!el) return;
  const res = await fetch(file);
  el.innerHTML = await res.text();
}

function updateNav() {
  const role = getRole();
  const logged = isLoggedIn();

  const signInLink = document.querySelector('[data-nav="signin"]');
  const dashboardLink = document.querySelector('[data-nav="dashboard"]');
  const coursesLink = document.querySelector('[data-nav="courses"]');
  const logoutBtn = document.querySelector('[data-nav="logout"]');
  const roleBadge = document.querySelector('[data-nav="role"]');

  if (signInLink) signInLink.style.display = logged ? "none" : "inline-block";
  if (dashboardLink) dashboardLink.style.display = logged ? "inline-block" : "none";
  if (coursesLink) coursesLink.style.display = logged ? "inline-block" : "none";
  if (logoutBtn) logoutBtn.style.display = logged ? "inline-block" : "none";

  if (roleBadge) {
    roleBadge.textContent = logged ? role : "";
    roleBadge.style.display = logged ? "inline-block" : "none";
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }
}

export async function initLayout() {
  await loadPartial("#header", "/partials/header.html");
  await loadPartial("#footer", "/partials/footer.html");
  updateNav();
}
