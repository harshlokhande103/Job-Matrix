import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const accessMessage = document.getElementById("adminAccessMessage");
const adminHero = document.getElementById("adminHero");
const adminMain = document.getElementById("adminMain");
const usersStatus = document.getElementById("adminUsersStatus");
const usersTableBody = document.getElementById("adminUsersTableBody");

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

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const formatCreatedAt = (value) => {
  if (!value) return "-";
  if (typeof value.toDate === "function") {
    return value.toDate().toLocaleString("en-IN");
  }
  return "-";
};

const setUsersStatus = (text) => {
  if (usersStatus) usersStatus.textContent = text;
};

const renderUsers = (users) => {
  if (!usersTableBody) return;
  if (!users.length) {
    usersTableBody.innerHTML =
      '<tr><td colspan="5" class="admin-users-empty">No registered users found.</td></tr>';
    return;
  }

  usersTableBody.innerHTML = users
    .map(
      (user) => `
        <tr>
          <td>${escapeHtml(user.fullName || "-")}</td>
          <td>${escapeHtml(user.email || "-")}</td>
          <td>${escapeHtml(user.phone || "-")}</td>
          <td><span class="admin-role-badge">${escapeHtml(user.role || "user")}</span></td>
          <td>${escapeHtml(formatCreatedAt(user.createdAt))}</td>
        </tr>
      `
    )
    .join("");
};

const loadRegisteredUsers = async (db) => {
  try {
    setUsersStatus("Loading users...");
    const usersRef = collection(db, "users");
    const usersQuery = query(usersRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(usersQuery);
    const users = snapshot.docs.map((docSnap) => docSnap.data());
    renderUsers(users);
    setUsersStatus(`Total users: ${users.length}`);
  } catch (error) {
    console.error("Users fetch error:", error);
    if (error.code === "permission-denied") {
      setUsersStatus(
        "Permission denied while reading users. Update Firestore rules to allow admin to read users collection."
      );
    } else {
      setUsersStatus("Failed to load users. Please verify Firestore configuration.");
    }
    renderUsers([]);
  }
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
        await loadRegisteredUsers(db);
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
