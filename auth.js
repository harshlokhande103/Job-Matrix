import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  doc,
  getDoc,
  getFirestore,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const POST_LOGIN_REDIRECT_KEY = "jm_post_login_redirect";
const REGISTER_SHEET_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbyEZspOpe2oAbRuLIPcrZbXPKGnX28mV7uCkH6gfqmaoZtzfYloI87LZx2WB7r_5S0I/exec";
const REGISTER_STORAGE_KEY = "jm_register_submissions_v1";

const hasValidFirebaseConfig = () =>
  firebaseConfig &&
  Object.values(firebaseConfig).every(
    (value) => typeof value === "string" && value.trim() && !value.startsWith("PASTE_YOUR_")
  );

const setMessage = (node, text, type = "info") => {
  if (!node) return;
  node.textContent = text;
  node.classList.remove("is-error", "is-success");
  if (type === "error") node.classList.add("is-error");
  if (type === "success") node.classList.add("is-success");
};

const mapAuthError = (code) => {
  switch (code) {
    case "auth/operation-not-allowed":
      return "Email/Password sign-in is not enabled in Firebase.";
    case "auth/unauthorized-domain":
      return "The current domain is not added to Firebase authorized domains.";
    case "auth/network-request-failed":
      return "Network issue. Please check your internet connection and try again.";
    case "permission-denied":
      return "Firestore rules are blocking this action.";
    case "failed-precondition":
      return "Firestore database is not created or enabled yet.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/missing-password":
      return "Password is required.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/email-already-in-use":
      return "This email is already registered. Please login.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email or password is incorrect.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again after some time.";
    default:
      return `Something went wrong (${code || "unknown"}). Please try again.`;
  }
};

const saveRegisterBackup = (entry) => {
  try {
    const existing = JSON.parse(localStorage.getItem(REGISTER_STORAGE_KEY) || "[]");
    existing.unshift(entry);
    localStorage.setItem(REGISTER_STORAGE_KEY, JSON.stringify(existing.slice(0, 200)));
  } catch {}
};

const sendRegisterToSheet = async (entry) => {
  await fetch(REGISTER_SHEET_WEB_APP_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(entry),
  });
};

if (!hasValidFirebaseConfig()) {
  const loginMessage = document.getElementById("loginMessage");
  const registerMessage = document.getElementById("registerMessage");
  setMessage(
    loginMessage || registerMessage,
    "Firebase config missing. Please update firebase-config.js first.",
    "error"
  );
} else {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const loginRedirectParam = new URLSearchParams(window.location.search).get("redirect");

  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");

  if (registerForm) {
    const message = document.getElementById("registerMessage");
    const submitBtn = document.getElementById("registerSubmitBtn");
    const termsCheckbox = document.getElementById("registerTermsAccepted");

    if (submitBtn && termsCheckbox) {
      submitBtn.disabled = !termsCheckbox.checked;
      termsCheckbox.addEventListener("change", () => {
        submitBtn.disabled = !termsCheckbox.checked;
      });
    }

    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (termsCheckbox && !termsCheckbox.checked) {
        setMessage(message, "Please accept the Terms & Conditions to continue.", "error");
        return;
      }

      const name = document.getElementById("registerName")?.value.trim() || "";
      const phone = document.getElementById("registerPhone")?.value.trim() || "";
      const email = document.getElementById("registerEmail")?.value.trim() || "";
      const cityState = document.getElementById("registerCityState")?.value.trim() || "";
      const bpoKpoExperience =
        document.getElementById("registerBpoKpoExperience")?.value.trim() || "";
      const experience = document.getElementById("registerExperience")?.value.trim() || "";

      if (!name || !phone || !email || !cityState || !bpoKpoExperience) {
        setMessage(message, "Please fill all fields.", "error");
        return;
      }

      submitBtn.disabled = true;
      setMessage(message, "Submitting your registration...");

      const registerEntry = {
        formType: "register",
        name,
        phone,
        email,
        cityState,
        bpoKpoExperience,
        experience: experience || "Not provided",
        page: window.location.href,
        createdAt: new Date().toISOString(),
      };

      saveRegisterBackup(registerEntry);

      try {
        await sendRegisterToSheet(registerEntry);
        alert("Registration submitted successfully.");
        setMessage(message, "Registration submitted successfully. Our team will contact you soon.", "success");
        registerForm.reset();
      } catch (error) {
        console.error("Register error:", error);
        setMessage(
          message,
          "Registration was saved locally, but Google Sheet could not be reached. Please try again.",
          "error"
        );
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  if (loginForm) {
    const message = document.getElementById("loginMessage");
    const submitBtn = document.getElementById("loginSubmitBtn");

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = document.getElementById("loginEmail")?.value.trim() || "";
      const password = document.getElementById("loginPassword")?.value || "";

      if (!email || !password) {
        setMessage(message, "Please enter email and password.", "error");
        return;
      }

      submitBtn.disabled = true;
      setMessage(message, "Signing in...");

      try {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        let redirectPage = "candidate-onboarding.html";
        const storedRedirect =
          sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY) || loginRedirectParam || "";

        try {
          const profileRef = doc(db, "users", credential.user.uid);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            const profile = profileSnap.data();
            if (profile.role === "admin") {
              redirectPage = "admin.html";
            } else if (profile.onboardingCompleted) {
              redirectPage = storedRedirect || "dashboard.html";
            }
          }
        } catch (profileError) {
          console.error("Profile fetch error:", profileError);
        }

        setMessage(message, "Login successful. Redirecting...", "success");
        loginForm.reset();
        setTimeout(() => {
          window.location.href = redirectPage;
        }, 700);
      } catch (error) {
        console.error("Login error:", error);
        setMessage(message, mapAuthError(error.code), "error");
      } finally {
        submitBtn.disabled = false;
      }
    });
  }
}
