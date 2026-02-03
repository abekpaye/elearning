const TOKEN_KEY = "learnify_token";
const ROLE_KEY = "learnify_role";

export function saveAuth(token, role) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRole(){
  return localStorage.getItem("role") || "";
}

export function isLoggedIn(){
  return !!localStorage.getItem("token");
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  window.location.href = "index.html";
}