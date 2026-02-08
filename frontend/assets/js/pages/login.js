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

    saveAuth(data.token);

    show("Login successful! Redirecting...", true);

    setTimeout(() => {
      window.location.href = "courses.html";
    }, 500);

  } catch (err) {
    show(err.message || "Login failed");
  }
});