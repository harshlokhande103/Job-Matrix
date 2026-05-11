import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  doc,
  getFirestore,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const plansBlock = document.getElementById("servicePlansBlock");

const hasValidFirebaseConfig = () =>
  firebaseConfig &&
  Object.values(firebaseConfig).every(
    (value) => typeof value === "string" && value.trim() && !value.startsWith("PASTE_YOUR_")
  );

const setPlansVisibility = (visible) => {
  if (!plansBlock) return;
  plansBlock.hidden = !visible;
};

if (plansBlock && hasValidFirebaseConfig()) {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const settingRef = doc(db, "siteSettings", "services");

  onSnapshot(
    settingRef,
    (snapshot) => {
      const plansVisible = snapshot.exists() ? snapshot.data()?.plansVisible !== false : true;
      setPlansVisibility(plansVisible);
    },
    (error) => {
      console.error("Service plans visibility error:", error);
      setPlansVisibility(true);
    }
  );
}
