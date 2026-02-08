import { apiRequest } from "../api.js";

const form = document.getElementById("registerForm");
const msg = document.getElementById("msg");

function show(text, ok = false) {
  msg.textContent = text;
  msg.style.color = ok ? "green" : "crimson";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  show("");

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    await apiRequest("/auth/register", {
      method: "POST",
      body: { name, email, password },
      auth: false,
    });

    show("Registration successful! Please login.", true);
    setTimeout(() => (window.location.href = "/login"), 700);
  } catch (err) {
    show(err.message || "Registration failed");
  }
});
