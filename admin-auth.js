import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, getIdToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
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

const deleteRegisteredUser = async (currentUser, targetUser) => {
  if (!currentUser?.uid || !targetUser?.uid) {
    throw new Error("Missing user details for delete.");
  }

  if (currentUser.uid === targetUser.uid) {
    throw new Error("Admin cannot delete their own account from this panel.");
  }

  const confirmed = window.confirm(
    `Delete ${targetUser.email || "this user"} permanently?\n\nThis removes both the Firestore profile and Firebase Authentication account. The same email can register again later.`
  );

  if (!confirmed) return false;

  setUsersStatus(`Deleting ${targetUser.email || "user"}...`);

  const idToken = await getIdToken(currentUser, true);
  const response = await fetch("/api/admin-delete-user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      uid: targetUser.uid,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Failed to delete user.");
  }

  return true;
};

const renderUsers = (users) => {
  if (!usersTableBody) return;
  if (!users.length) {
    usersTableBody.innerHTML =
      '<tr><td colspan="6" class="admin-users-empty">No registered users found.</td></tr>';
    return;
  }

  usersTableBody.innerHTML = users
    .map(
      (user) => `
        <tr>
          <td data-label="Name">${escapeHtml(user.fullName || "-")}</td>
          <td data-label="Email">${escapeHtml(user.email || "-")}</td>
          <td data-label="Phone">${escapeHtml(user.phone || "-")}</td>
          <td data-label="Role"><span class="admin-role-badge">${escapeHtml(
            user.role || "user"
          )}</span></td>
          <td data-label="Created">${escapeHtml(formatCreatedAt(user.createdAt))}</td>
          <td data-label="Actions">
            ${
              user.role === "admin"
                ? '<span class="admin-action-note">Protected</span>'
                : `<button type="button" class="admin-delete-btn" data-user-uid="${escapeHtml(
                    user.uid || ""
                  )}" data-user-email="${escapeHtml(user.email || "")}">Delete Permanently</button>`
            }
          </td>
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
    const users = snapshot.docs.map((docSnap) => ({
      docId: docSnap.id,
      ...docSnap.data(),
    }));
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
  let currentAdminUser = null;

  if (usersTableBody) {
    usersTableBody.addEventListener("click", async (event) => {
      const button = event.target.closest(".admin-delete-btn");
      if (!button) return;

      const targetUid = button.dataset.userUid || "";
      const targetEmail = button.dataset.userEmail || "";
      if (!targetUid) return;

      button.disabled = true;
      const originalText = button.textContent;
      button.textContent = "Deleting...";

      try {
        const didDelete = await deleteRegisteredUser(currentAdminUser, {
          uid: targetUid,
          email: targetEmail,
        });

        if (didDelete) {
          await loadRegisteredUsers(db);
          setUsersStatus(`Deleted ${targetEmail || "user"} permanently.`);
        } else {
          await loadRegisteredUsers(db);
        }
      } catch (error) {
        console.error("Delete user error:", error);
        setUsersStatus(error.message || "Failed to delete user.");
      } finally {
        button.disabled = false;
        button.textContent = originalText;
      }
    });
  }

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
        currentAdminUser = user;
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
