const TOKEN_KEY = "learnify_token";

/* save ONLY token */
export function saveAuth(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

/* 🔥 ROLE FROM TOKEN */
export function getRole() {
  const token = getToken();
  if (!token) return null;

  const payload = parseJwt(token);
  return payload?.role || null;
}

export function getUserId() {
  const token = getToken();
  if (!token) return null;

  const payload = parseJwt(token);
  return payload?.id || null;
}

export function isLoggedIn() {
  return !!getToken();
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  window.location.href = "index.html";
}