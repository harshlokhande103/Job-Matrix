import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { doc, getDoc, getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const hasValidFirebaseConfig = () =>
  firebaseConfig &&
  Object.values(firebaseConfig).every(
    (value) => typeof value === "string" && value.trim() && !value.startsWith("PASTE_YOUR_")
  );

const textOrFallback = (value, fallback = "Not available") =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

const formatCreatedAt = (value) => {
  if (!value) return "Not available";

  try {
    const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
    if (Number.isNaN(date.getTime())) return "Not available";

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return "Not available";
  }
};

const setText = (id, value) => {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
};

const setAvatar = (name) => {
  const avatarNode = document.getElementById("dashboardAvatar");
  if (!avatarNode) return;

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  avatarNode.textContent = initials || "U";
};

if (!hasValidFirebaseConfig()) {
  window.location.href = "login.html";
} else {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const logoutBtn = document.getElementById("dashboardLogoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await signOut(auth);
        window.location.href = "login.html";
      } catch (error) {
        console.error("Logout error:", error);
        alert("Logout failed. Please try again.");
      }
    });
  }

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    let profile = null;

    try {
      const profileSnap = await getDoc(doc(db, "users", user.uid));
      if (profileSnap.exists()) {
        profile = profileSnap.data();
      }
    } catch (error) {
      console.error("Dashboard profile fetch error:", error);
    }

    let localProfile = {};
    try {
      localProfile = JSON.parse(localStorage.getItem(`jm_user_profile_${user.uid}`) || "{}");
    } catch {
      localProfile = {};
    }

    const fullName = textOrFallback(
      profile?.fullName || user.displayName || localProfile.fullName,
      "Job Matrix User"
    );
    const email = textOrFallback(profile?.email || user.email);
    const phone = textOrFallback(profile?.phone || localProfile.phone);
    const role = textOrFallback(profile?.role, "user");
    const joined = formatCreatedAt(profile?.createdAt || user.metadata?.creationTime);

    if (role.toLowerCase() !== "admin" && !profile?.onboardingCompleted) {
      window.location.href = "candidate-onboarding.html";
      return;
    }

    setText("dashboardHeroName", fullName);
    setText("dashboardCardName", fullName);
    setText("dashboardCardEmail", email);
    setText("dashboardCardPhone", phone);
    setText("dashboardRoleBadge", role.charAt(0).toUpperCase() + role.slice(1));
    setText("dashboardProfileName", fullName);
    setText("dashboardFullName", fullName);
    setText("dashboardEmail", email);
    setText("dashboardPhone", phone);
    setText("dashboardRole", role);
    setText("dashboardUid", user.uid);
    setText("dashboardJoined", joined);
    setText("dashboardQuickEmail", email);

    if (role.toLowerCase() === "admin") {
      setText("dashboardStatusTitle", "Admin Account");
      setText(
        "dashboardStatusText",
        "Is account par admin level access configured hai. Aap admin panel se management kar sakte hain."
      );
      setText("dashboardAccountStatus", "Admin Access");
    }

    setAvatar(fullName);
  });
}
