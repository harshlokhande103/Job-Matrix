import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  collection,
  doc,
  getDoc,
  getDocsFromServer,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const accessMessage = document.getElementById("adminAccessMessage");
const adminHero = document.getElementById("adminHero");
const adminMain = document.getElementById("adminMain");
const applicationsStatus = document.getElementById("adminApplicationsStatus");
const applicationsTableBody = document.getElementById("adminApplicationsTableBody");
const usersStatus = document.getElementById("adminUsersStatus");
const usersTableBody = document.getElementById("adminUsersTableBody");
const downloadUsersButton = document.getElementById("adminDownloadUsers");
const downloadContactsButton = document.getElementById("adminDownloadContacts");
const contactStatus = document.getElementById("adminContactStatus");
const contactList = document.getElementById("adminContactList");
const onboardingStatus = document.getElementById("adminOnboardingStatus");
const onboardingDetails = document.getElementById("adminOnboardingDetails");
const CONTACT_SUBMISSIONS_STORAGE_KEY = "jm_contact_submissions_v1";
let registeredUsers = [];
let contactSubmissions = [];
let unsubscribeApplications = null;

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
  const parsedDate = new Date(value);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toLocaleString("en-IN");
  }
  return "-";
};

const setUsersStatus = (text) => {
  if (usersStatus) usersStatus.textContent = text;
};

const setApplicationsStatus = (text) => {
  if (applicationsStatus) applicationsStatus.textContent = text;
};

const setContactStatus = (text) => {
  if (contactStatus) contactStatus.textContent = text;
};

const setOnboardingStatus = (text) => {
  if (onboardingStatus) onboardingStatus.textContent = text;
};

const formatListValue = (value) => {
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "-";
  }
  return value ? String(value) : "-";
};

const downloadUsersList = (users) => {
  if (!users.length) {
    setUsersStatus("No users available to download.");
    return;
  }

  const jsPdfLib = window.jspdf?.jsPDF;
  if (!jsPdfLib) {
    setUsersStatus("PDF library failed to load. Please refresh and try again.");
    return;
  }

  const doc = new jsPdfLib({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });
  const dateStamp = new Date().toISOString().slice(0, 10);
  const tableRows = users.map((user) => [
    user.fullName || "-",
    user.email || "-",
    user.phone || "-",
    user.role || "user",
    user.onboardingCompleted ? "Completed" : "Pending",
    formatCreatedAt(user.createdAt),
  ]);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Job Matrix Registered Users", 40, 42);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Downloaded on: ${new Date().toLocaleString("en-IN")}`, 40, 62);

  doc.autoTable({
    startY: 78,
    head: [["Name", "Email", "Phone", "Role", "Onboarding", "Created"]],
    body: tableRows,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 6,
      textColor: [34, 57, 92],
    },
    headStyles: {
      fillColor: [47, 113, 255],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 248, 252],
    },
    margin: {
      left: 28,
      right: 28,
    },
  });

  doc.save(`job-matrix-users-${dateStamp}.pdf`);
  setUsersStatus(`Downloaded ${users.length} users as PDF.`);
};

const downloadContactSubmissions = (submissions) => {
  if (!submissions.length) {
    setContactStatus("No contact submissions available to download.");
    return;
  }

  const jsPdfLib = window.jspdf?.jsPDF;
  if (!jsPdfLib) {
    setContactStatus("PDF library failed to load. Please refresh and try again.");
    return;
  }

  const doc = new jsPdfLib({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });
  const dateStamp = new Date().toISOString().slice(0, 10);
  const tableRows = submissions.map((item) => [
    item.fullName || "-",
    item.email || "-",
    item.phone || "-",
    item.category || "General Inquiry",
    item.message || "-",
    formatCreatedAt(item.createdAt),
  ]);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Job Matrix Contact Form Submissions", 40, 42);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Downloaded on: ${new Date().toLocaleString("en-IN")}`, 40, 62);

  doc.autoTable({
    startY: 78,
    head: [["Name", "Email", "Phone", "Category", "Message", "Created"]],
    body: tableRows,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 6,
      textColor: [34, 57, 92],
      overflow: "linebreak",
      cellWidth: "wrap",
    },
    headStyles: {
      fillColor: [47, 113, 255],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 248, 252],
    },
    columnStyles: {
      4: {
        cellWidth: 240,
      },
    },
    margin: {
      left: 24,
      right: 24,
    },
  });

  doc.save(`job-matrix-contact-submissions-${dateStamp}.pdf`);
  setContactStatus(`Downloaded ${submissions.length} contact submissions as PDF.`);
};

const renderUsers = (users) => {
  if (!usersTableBody) return;
  if (!users.length) {
    usersTableBody.innerHTML =
      '<tr><td colspan="7" class="admin-users-empty">No registered users found.</td></tr>';
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
          <td data-label="Onboarding">
            <span class="admin-role-badge ${user.onboardingCompleted ? "is-complete" : "is-pending"}">
              ${escapeHtml(user.onboardingCompleted ? "Completed" : "Pending")}
            </span>
          </td>
          <td data-label="Created">${escapeHtml(formatCreatedAt(user.createdAt))}</td>
          <td data-label="Actions">
            <button type="button" class="admin-view-btn" data-user-id="${escapeHtml(
              user.docId || user.uid || ""
            )}">View Details</button>
          </td>
        </tr>
      `
    )
    .join("");
};

const renderApplications = (applications) => {
  if (!applicationsTableBody) return;
  if (!applications.length) {
    applicationsTableBody.innerHTML =
      '<tr><td colspan="7" class="admin-users-empty">No job applications found.</td></tr>';
    return;
  }

  applicationsTableBody.innerHTML = applications
    .map(
      (application) => `
        <tr>
          <td data-label="Name">${escapeHtml(application.applicantName || "-")}</td>
          <td data-label="Email">${escapeHtml(application.applicantEmail || "-")}</td>
          <td data-label="Phone">${escapeHtml(application.applicantPhone || "-")}</td>
          <td data-label="Job Title">${escapeHtml(application.jobTitle || "-")}</td>
          <td data-label="Company">${escapeHtml(application.jobCompany || "-")}</td>
          <td data-label="Source">${escapeHtml(application.source || "-")}</td>
          <td data-label="Applied">${escapeHtml(formatCreatedAt(application.appliedAt))}</td>
        </tr>
      `
    )
    .join("");
};

const renderOnboardingDetails = (user) => {
  if (!onboardingDetails) return;

  const details = user?.onboardingDetails;
  if (!user || !details) {
    onboardingDetails.innerHTML = `
      <div class="admin-onboarding-empty">
        No onboarding form submitted yet for this user.
      </div>
    `;
    return;
  }

  const detailRows = [
    ["Full Name", user.fullName || "-"],
    ["Email", user.email || "-"],
    ["Phone", user.phone || "-"],
    ["Gender", details.gender],
    ["Date of Birth", details.dateOfBirth],
    ["Age", details.age],
    ["WhatsApp Number", details.whatsappNumber],
    ["Alternative Number", details.alternativeNumber],
    ["Current Address", details.currentAddress],
    ["Current City & State", details.currentCityState],
    ["Permanent Address", details.permanentAddress],
    ["Highest Qualification", details.highestQualification],
    ["Education Status", details.educationStatus],
    ["Field / Stream", details.fieldStream],
    ["Passing Year", details.passingYear],
    ["Job Status", details.jobStatus],
    ["Years of Experience", details.yearsExperience],
    ["Preferred Job Type", formatListValue(details.preferredJobType)],
    ["Preferred Role / Department", formatListValue(details.preferredRole)],
    ["Joining Availability", details.joiningAvailability],
    ["Expected Salary", details.expectedSalary],
    ["English Rating", details.englishRating],
    ["Languages", formatListValue(details.languages)],
    ["Skills", details.skills],
    ["Hobbies", details.hobbies],
    ["Resume", details.hasResume],
    ["Father's Occupation", details.fatherOccupation],
    ["Mother's Occupation", details.motherOccupation],
    ["Job Reason", formatListValue(details.jobReason)],
    ["Support Needed", formatListValue(details.supportNeeded)],
    ["Found Us Through", details.foundUs],
    ["Interested In Program", details.interestedProgram],
    ["Submitted On", formatCreatedAt(user.onboardingSubmittedAt)],
  ];

  onboardingDetails.innerHTML = `
    <div class="admin-onboarding-grid">
      ${detailRows
        .map(
          ([label, value]) => `
            <div class="admin-onboarding-item">
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(formatListValue(value))}</strong>
            </div>
          `
        )
        .join("")}
    </div>
  `;
};

const renderContactSubmissions = (submissions) => {
  if (!contactList) return;
  if (!submissions.length) {
    contactList.innerHTML =
      '<tr><td colspan="7" class="admin-users-empty">No contact submissions found.</td></tr>';
    return;
  }

  contactList.innerHTML = submissions
    .map(
      (item) => `
        <tr>
          <td data-label="Name">${escapeHtml(item.fullName || "-")}</td>
          <td data-label="Email">${escapeHtml(item.email || "-")}</td>
          <td data-label="Phone">${escapeHtml(item.phone || "-")}</td>
          <td data-label="Category">${escapeHtml(item.category || "General Inquiry")}</td>
          <td data-label="Message">${escapeHtml(item.message || "-")}</td>
          <td data-label="Created">${escapeHtml(formatCreatedAt(item.createdAt))}</td>
          <td data-label="Actions">
            <button type="button" class="admin-delete-btn" data-contact-id="${escapeHtml(
              item.id || item.docId || ""
            )}">Delete</button>
          </td>
        </tr>
      `
    )
    .join("");
};

const readContactSubmissions = () => {
  try {
    const raw = localStorage.getItem(CONTACT_SUBMISSIONS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveContactSubmissions = (submissions) => {
  localStorage.setItem(CONTACT_SUBMISSIONS_STORAGE_KEY, JSON.stringify(submissions));
};

const loadRegisteredUsers = async (db) => {
  try {
    setUsersStatus("Loading users...");
    const usersRef = collection(db, "users");
    const usersQuery = query(usersRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocsFromServer(usersQuery);
    const users = snapshot.docs.map((docSnap) => ({
      docId: docSnap.id,
      ...docSnap.data(),
    }));
    registeredUsers = users;
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
    registeredUsers = [];
    renderUsers([]);
  }
};

const loadContactSubmissions = () => {
  setContactStatus("Loading contact submissions...");
  contactSubmissions = readContactSubmissions();
  renderContactSubmissions(contactSubmissions);
  setContactStatus(`Total messages: ${contactSubmissions.length}`);
};

const loadJobApplications = (db) => {
  if (unsubscribeApplications) {
    unsubscribeApplications();
  }

  try {
    setApplicationsStatus("Loading applications...");
    const applicationsRef = collection(db, "jobApplications");
    const applicationsQuery = query(applicationsRef, orderBy("appliedAt", "desc"));
    unsubscribeApplications = onSnapshot(
      applicationsQuery,
      (snapshot) => {
        const applications = snapshot.docs.map((docSnap) => ({
          docId: docSnap.id,
          ...docSnap.data(),
        }));
        renderApplications(applications);
        setApplicationsStatus(`Total applications: ${applications.length}`);
      },
      (error) => {
        console.error("Applications fetch error:", error);
        if (error.code === "permission-denied") {
          setApplicationsStatus(
            "Permission denied while reading applications. Update Firestore rules for jobApplications."
          );
        } else {
          setApplicationsStatus("Failed to load applications. Please verify Firestore configuration.");
        }
        renderApplications([]);
      }
    );
  } catch (error) {
    console.error("Applications setup error:", error);
    setApplicationsStatus("Failed to initialize applications list.");
    renderApplications([]);
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

  if (downloadUsersButton) {
    downloadUsersButton.addEventListener("click", () => {
      downloadUsersList(registeredUsers);
    });
  }

  if (downloadContactsButton) {
    downloadContactsButton.addEventListener("click", () => {
      downloadContactSubmissions(contactSubmissions);
    });
  }

  if (contactList) {
    contactList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-contact-id]");
      if (!button) return;

      const contactId = button.getAttribute("data-contact-id");
      if (!contactId) return;

      const confirmed = window.confirm("Delete this contact submission?");
      if (!confirmed) return;

      contactSubmissions = contactSubmissions.filter(
        (item) => String(item.id || item.docId || "") !== String(contactId)
      );
      saveContactSubmissions(contactSubmissions);
      renderContactSubmissions(contactSubmissions);
      setContactStatus(`Total messages: ${contactSubmissions.length}`);
    });
  }

  if (usersTableBody) {
    usersTableBody.addEventListener("click", (event) => {
      const button = event.target.closest("[data-user-id]");
      if (!button) return;

      const userId = button.getAttribute("data-user-id");
      const selectedUser = registeredUsers.find(
        (item) => String(item.docId || item.uid || "") === String(userId)
      );

      if (!selectedUser) return;
      renderOnboardingDetails(selectedUser);
      setOnboardingStatus(
        `Showing onboarding details for ${selectedUser.fullName || selectedUser.email || "selected user"}.`
      );
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
        showAdmin();
        loadJobApplications(db);
        await loadRegisteredUsers(db);
        renderOnboardingDetails(null);
        loadContactSubmissions();
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
