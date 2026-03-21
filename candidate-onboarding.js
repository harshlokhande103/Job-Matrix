import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const hasValidFirebaseConfig = () =>
  firebaseConfig &&
  Object.values(firebaseConfig).every(
    (value) => typeof value === "string" && value.trim() && !value.startsWith("PASTE_YOUR_")
  );

const setMessage = (text, type = "info") => {
  const messageNode = document.getElementById("candidateFormMessage");
  if (!messageNode) return;

  messageNode.textContent = text;
  messageNode.classList.remove("is-error", "is-success");
  if (type === "error") messageNode.classList.add("is-error");
  if (type === "success") messageNode.classList.add("is-success");
};

const getCheckedValues = (name) =>
  Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);

const setCheckedValues = (name, values) => {
  const selectedValues = Array.isArray(values) ? values : [];
  document.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
    input.checked = selectedValues.includes(input.value);
  });
};

const setFieldValue = (id, value) => {
  const field = document.getElementById(id);
  if (field && typeof value === "string") {
    field.value = value;
  }
};

const fillOnboardingValues = (details = {}) => {
  setFieldValue("gender", details.gender || "");
  setFieldValue("dob", details.dateOfBirth || "");
  setFieldValue("age", details.age || "");
  setFieldValue("contactNumber", details.contactNumber || "");
  setFieldValue("whatsappNumber", details.whatsappNumber || "");
  setFieldValue("alternativeNumber", details.alternativeNumber || "");
  setFieldValue("currentAddress", details.currentAddress || "");
  setFieldValue("currentCityState", details.currentCityState || "");
  setFieldValue("permanentAddress", details.permanentAddress || "");
  setFieldValue("highestQualification", details.highestQualification || "");
  setFieldValue("educationStatus", details.educationStatus || "");
  setFieldValue("fieldStream", details.fieldStream || "");
  setFieldValue("passingYear", details.passingYear || "");
  setFieldValue("jobStatus", details.jobStatus || "");
  setFieldValue("yearsExperience", details.yearsExperience || "");
  setFieldValue("joiningAvailability", details.joiningAvailability || "");
  setFieldValue("expectedSalary", details.expectedSalary || "");
  setFieldValue("englishRating", details.englishRating || "");
  setFieldValue("skills", details.skills || "");
  setFieldValue("hobbies", details.hobbies || "");
  setFieldValue("hasResume", details.hasResume || "");
  setFieldValue("fatherOccupation", details.fatherOccupation || "");
  setFieldValue("motherOccupation", details.motherOccupation || "");
  setFieldValue("foundUs", details.foundUs || "");
  setFieldValue("interestedProgram", details.interestedProgram || "");

  setCheckedValues("preferredJobType", details.preferredJobType);
  setCheckedValues("preferredRole", details.preferredRole);
  setCheckedValues("languages", details.languages);
  setCheckedValues("jobReason", details.jobReason);
  setCheckedValues("supportNeeded", details.supportNeeded);
};

if (!hasValidFirebaseConfig()) {
  window.location.href = "login.html";
} else {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const logoutBtn = document.getElementById("candidateLogoutBtn");
  const form = document.getElementById("candidateOnboardingForm");
  const submitBtn = document.getElementById("candidateFormSubmitBtn");
  const isEditMode = new URLSearchParams(window.location.search).get("edit") === "1";

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await signOut(auth);
      window.location.href = "login.html";
    });
  }

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    let profile = null;
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        profile = snap.data();
      }
    } catch (error) {
      console.error("Onboarding profile fetch error:", error);
    }

    if (profile?.role === "admin") {
      window.location.href = "admin.html";
      return;
    }

    if (profile?.onboardingCompleted && !isEditMode) {
      window.location.href = "dashboard.html";
      return;
    }

    setFieldValue("fullName", profile?.fullName || user.displayName || "");
    setFieldValue("emailId", profile?.email || user.email || "");
    setFieldValue("contactNumber", profile?.phone || "");
    setFieldValue("whatsappNumber", profile?.phone || "");
    fillOnboardingValues(profile?.onboardingDetails || {});

    if (!form) return;

    if (form.dataset.bound === "true") return;
    form.dataset.bound = "true";

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const preferredJobType = getCheckedValues("preferredJobType");
        const preferredRole = getCheckedValues("preferredRole");
        const languages = getCheckedValues("languages");
        const jobReason = getCheckedValues("jobReason");
        const supportNeeded = getCheckedValues("supportNeeded");

        submitBtn.disabled = true;
        setMessage("Submitting your form...");

        try {
          await setDoc(
            doc(db, "users", user.uid),
            {
              uid: user.uid,
              fullName: document.getElementById("fullName")?.value.trim() || profile?.fullName || "",
              email: document.getElementById("emailId")?.value.trim() || profile?.email || user.email || "",
              phone: document.getElementById("contactNumber")?.value.trim() || profile?.phone || "",
              role: profile?.role || "user",
              onboardingCompleted: true,
              onboardingSubmittedAt: serverTimestamp(),
              onboardingDetails: {
                gender: document.getElementById("gender")?.value || "",
                dateOfBirth: document.getElementById("dob")?.value || "",
                age: document.getElementById("age")?.value || "",
                contactNumber: document.getElementById("contactNumber")?.value.trim() || "",
                whatsappNumber: document.getElementById("whatsappNumber")?.value.trim() || "",
                alternativeNumber: document.getElementById("alternativeNumber")?.value.trim() || "",
                currentAddress: document.getElementById("currentAddress")?.value.trim() || "",
                currentCityState: document.getElementById("currentCityState")?.value.trim() || "",
                permanentAddress: document.getElementById("permanentAddress")?.value.trim() || "",
                highestQualification: document.getElementById("highestQualification")?.value.trim() || "",
                educationStatus: document.getElementById("educationStatus")?.value || "",
                fieldStream: document.getElementById("fieldStream")?.value || "",
                passingYear: document.getElementById("passingYear")?.value.trim() || "",
                jobStatus: document.getElementById("jobStatus")?.value || "",
                yearsExperience: document.getElementById("yearsExperience")?.value.trim() || "",
                preferredJobType,
                preferredRole,
                joiningAvailability: document.getElementById("joiningAvailability")?.value || "",
                expectedSalary: document.getElementById("expectedSalary")?.value || "",
                englishRating: document.getElementById("englishRating")?.value || "",
                languages,
                skills: document.getElementById("skills")?.value.trim() || "",
                hobbies: document.getElementById("hobbies")?.value.trim() || "",
                hasResume: document.getElementById("hasResume")?.value || "",
                fatherOccupation: document.getElementById("fatherOccupation")?.value.trim() || "",
                motherOccupation: document.getElementById("motherOccupation")?.value.trim() || "",
                jobReason,
                supportNeeded,
                foundUs: document.getElementById("foundUs")?.value || "",
                interestedProgram: document.getElementById("interestedProgram")?.value || "",
              },
            },
            { merge: true }
          );

          setMessage(
            isEditMode
              ? "Details updated successfully. Redirecting to dashboard..."
              : "Form submitted successfully. Redirecting to dashboard...",
            "success"
          );
          setTimeout(() => {
            window.location.href = "dashboard.html";
          }, 800);
        } catch (error) {
          console.error("Onboarding submit error:", error);
          setMessage("Form submit nahi ho paya. Please try again.", "error");
        } finally {
          submitBtn.disabled = false;
        }
      });
  });
}
