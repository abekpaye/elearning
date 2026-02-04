import { BASE_URL } from "./config.js";
import { getToken } from "./auth.js";

export async function apiRequest(path, { method = "GET", body = null, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    localStorage.removeItem("learnify_token");

    if (!window.location.pathname.includes("login.html")) {
      const next = encodeURIComponent(
        window.location.pathname + window.location.search
      );
      window.location.href = `login.html?next=${next}`;
    }

    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const msg =
      data?.message ||
      data?.error ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}