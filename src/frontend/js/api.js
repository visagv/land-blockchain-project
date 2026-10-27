// This file has small helper functions used across ALL pages.
// Since backend and frontend run on the same server (see server.js),
// we can just use relative paths like "/api/..." here.

// Save login info after successful login
function saveSession(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

// Get the logged-in user's info (or null if not logged in)
function getUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

function getToken() {
  return localStorage.getItem("token");
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

// If a page requires login, call this at the top of the page's script.
// Optionally pass a role ("officer") to restrict the page further.
function requireLogin(requiredRole) {
  const user = getUser();
  if (!user || !getToken()) {
    window.location.href = "login.html";
    return null;
  }
  if (requiredRole && user.role !== requiredRole) {
    alert("Access denied. This page is for " + requiredRole + "s only.");
    window.location.href = "dashboard.html";
    return null;
  }
  return user;
}

// Helper to show a message box (green = success, red = error)
function showMsg(elementId, text, isError) {
  const el = document.getElementById(elementId);
  el.textContent = text;
  el.className = "msg " + (isError ? "error" : "success");
}

// Add "Blockchain" link to the navbar on every page
document.addEventListener("DOMContentLoaded", () => {
  const l = document.querySelector("nav .links");
  if (l && !l.querySelector('[href="ledger.html"]')) l.insertAdjacentHTML("afterbegin", '<a href="index.html">Home</a><a href="ledger.html">Blockchain</a>');
});

function landIdError(id) {
  id = (id || "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9\-\/]{2,19}$/.test(id)) return "Land ID must be 3-20 characters: letters, numbers, - or / (e.g. 362 or SY-101).";
  if (!/[1-9]/.test(id)) return "Enter a real survey number. A Land ID of only zeros is not valid.";
  if (/^(.)\1+$/.test(id)) return "Land ID cannot be one character repeated.";
  return "";
}
function passwordError(pw) {
  pw = pw || "";
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Password needs both letters and numbers.";
  if (/(password|qwerty|123456|abcdef|letmein)/i.test(pw)) return "Password is too easy to guess.";
  return "";
}
