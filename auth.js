import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const POST_LOGIN_REDIRECT_KEY = "jm_post_login_redirect";

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
      return "Firestore rules permission deny kar rahi hain.";
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

    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = document.getElementById("registerName")?.value.trim() || "";
      const email = document.getElementById("registerEmail")?.value.trim() || "";
      const phone = document.getElementById("registerPhone")?.value.trim() || "";
      const password = document.getElementById("registerPassword")?.value || "";

      if (!name || !email || !phone || !password) {
        setMessage(message, "Please fill all fields.", "error");
        return;
      }

      if (password.length < 6) {
        setMessage(message, "Password must be at least 6 characters.", "error");
        return;
      }

      submitBtn.disabled = true;
      setMessage(message, "Creating account...");

      let createdUser = null;
      try {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        createdUser = credential.user;
        await updateProfile(credential.user, { displayName: name });

        await setDoc(doc(db, "users", credential.user.uid), {
          uid: credential.user.uid,
          fullName: name,
          email,
          phone,
          role: "user",
          createdAt: serverTimestamp(),
        });

        localStorage.setItem(
          `jm_user_profile_${credential.user.uid}`,
          JSON.stringify({ fullName: name, phone })
        );
        alert("Registration successful.");
        setMessage(message, "Account created successfully. Redirecting to form...", "success");
        registerForm.reset();
        setTimeout(() => {
          window.location.href = "candidate-onboarding.html";
        }, 900);
      } catch (error) {
        console.error("Register error:", error);
        if (createdUser && error.code === "permission-denied") {
          setMessage(
            message,
            "The account was created in Authentication, but Firestore rules blocked profile saving. Update Firestore rules and set role (user/admin) manually for this UID in the users collection.",
            "error"
          );
        } else {
          setMessage(message, mapAuthError(error.code), "error");
        }
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
