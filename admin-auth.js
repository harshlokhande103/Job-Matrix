import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { doc, getDoc, getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const accessMessage = document.getElementById("adminAccessMessage");
const adminHero = document.getElementById("adminHero");
const adminMain = document.getElementById("adminMain");

const showMessage = (html) => {
  if (!accessMessage) return;
  accessMessage.innerHTML = `
    <div class="container admin-access-wrap">
      ${html}
    </div>
  `;
};

const showAdmin = () => {
  if (adminHero) adminHero.hidden = false;
  if (adminMain) adminMain.hidden = false;
  if (accessMessage) accessMessage.hidden = true;
};

const isConfigValid =
  firebaseConfig &&
  Object.values(firebaseConfig).every(
    (value) => typeof value === "string" && value.trim() && !value.startsWith("PASTE_YOUR_")
  );

if (!isConfigValid) {
  showMessage("<p>Firebase config is missing. Please complete firebase-config.js first.</p>");
} else {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        showMessage(
          "<p>User profile was not found in Firestore. Register again or add the user document in the users collection.</p>"
        );
        return;
      }

      const userData = userDocSnap.data();
      if (userData.role === "admin") {
        showAdmin();
        return;
      }

      showMessage(`
        <p>Access denied. Your current role is <strong>${String(userData.role || "user")}</strong>.</p>
        <p>To open the admin panel, set this user's role to <strong>admin</strong> in Firestore.</p>
        <button class="admin-back-btn" onclick="window.location.href='index.html'">Back to Home</button>
      `);
    } catch (error) {
      console.error("Admin access check error:", error);
      showMessage("<p>Admin access check failed. Please verify Firestore rules and configuration.</p>");
    }
  });
}
