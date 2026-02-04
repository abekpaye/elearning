import { apiRequest } from "../api.js";
import { saveAuth } from "../auth.js";

const form = document.getElementById("loginForm");
const msg = document.getElementById("msg");

function show(text, ok = false) {
  msg.textContent = text;
  msg.style.color = ok ? "green" : "crimson";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  show("");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });

    const token = data.token;
    const role = data.role || data.user?.role || "";

    saveAuth(token, role);

    // ✅ redirect to next page if provided
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");

    show("Login successful! Redirecting...", true);
    setTimeout(() => {
      window.location.href = next ? next : "courses.html";
    }, 600);
  } catch (err) {
    show(err.message || "Login failed");
  }
});
