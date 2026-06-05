/* login.js — posts the team password to /api/auth, then enters the app */
const form = document.getElementById("loginForm");
const pw = document.getElementById("pw");
const err = document.getElementById("err");
const btn = document.getElementById("loginBtn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  err.textContent = "";
  btn.disabled = true;
  btn.textContent = "Signing in…";
  try {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw.value }),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok && j.ok) {
      location.href = "/";
      return;
    }
    err.textContent = j.error || "Invalid password.";
  } catch (_) {
    err.textContent = "Network error. Try again.";
  }
  btn.disabled = false;
  btn.textContent = "Sign in";
});
