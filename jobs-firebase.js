import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const PENDING_JOB_APPLICATION_KEY = "jm_pending_job_application";
const POST_LOGIN_REDIRECT_KEY = "jm_post_login_redirect";

const defaultJobsData = [
  {
    id: "default-1",
    type: "Hybrid",
    date: "1/19/2026",
    title: "HR Recruiter",
    company: "JobConnect Consultancy",
    location: "Mumbai",
    salary: "3L - 5L PA",
    description: "End-to-end recruitment for IT and Non-IT clients.",
  },
  {
    id: "default-2",
    type: "Remote",
    date: "1/19/2026",
    title: "Customer Support Executive",
    company: "Global Connect BPO",
    location: "Remote (Pan India)",
    salary: "2.5L - 4L PA",
    description: "Handle international voice/non-voice processes. Night shift.",
  },
  {
    id: "default-3",
    type: "WFO",
    date: "1/19/2026",
    title: "Senior React Developer",
    company: "TechCorp Solutions",
    location: "Bangalore",
    salary: "20L - 30L PA",
    description: "We are looking for an experienced React developer to join our team.",
  },
];

const isConfigValid =
  firebaseConfig &&
  Object.values(firebaseConfig).every(
    (value) => typeof value === "string" && value.trim() && !value.startsWith("PASTE_YOUR_")
  );

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const normalizeJobType = (value) => {
  const type = String(value ?? "").trim();
  if (!type) return "WFO";
  if (type.toUpperCase() === "WFH") return "WFH";
  if (type.toUpperCase() === "WFO") return "WFO";
  if (type.toLowerCase() === "remote") return "Remote";
  if (type.toLowerCase() === "hybrid") return "Hybrid";
  return type;
};

const formatJobDate = (value) => {
  if (!value) return new Date().toLocaleDateString("en-IN");
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-IN");
};

const createJobCardMarkup = (job) => {
  const safeType = escapeHtml(normalizeJobType(job.type));
  const safeDate = escapeHtml(job.date || "");
  const safeTitle = escapeHtml(job.title || "");
  const safeCompany = escapeHtml(job.company || "");
  const safeLocation = escapeHtml(job.location || "");
  const safeSalary = escapeHtml(job.salary || "");
  const safeDescription = escapeHtml(job.description || "");
  const mutedClass = safeType.toLowerCase() === "remote" ? " muted" : "";

  return `
    <article class="job-card">
      <div class="job-card-head">
        <span class="job-type${mutedClass}">${safeType}</span>
        <span class="job-date">${safeDate}</span>
      </div>
      <h3>${safeTitle}</h3>
      <ul class="job-meta">
        <li>&#127970; ${safeCompany}</li>
        <li>&#128205; ${safeLocation}</li>
        <li>&#8377; ${safeSalary}</li>
      </ul>
      <p>${safeDescription}</p>
      <button class="job-apply-btn" type="button" data-apply-job-id="${escapeHtml(job.id)}">Apply Now</button>
    </article>
  `;
};

const storePendingApplication = (payload, redirectPage = "jobs.html") => {
  sessionStorage.setItem(PENDING_JOB_APPLICATION_KEY, JSON.stringify(payload));
  sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, redirectPage);
};

const readPendingApplication = () => {
  try {
    const raw = sessionStorage.getItem(PENDING_JOB_APPLICATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const clearPendingApplication = () => {
  sessionStorage.removeItem(PENDING_JOB_APPLICATION_KEY);
};

const mapSourceLabel = (value) => {
  if (value === "dashboard") return "Dashboard";
  if (value === "jobs-page") return "Jobs Page";
  return "Website";
};

const getUserProfile = async (db, user) => {
  if (!user) return null;
  try {
    const profileSnap = await getDoc(doc(db, "users", user.uid));
    return profileSnap.exists() ? profileSnap.data() : null;
  } catch (error) {
    console.error("User profile fetch error:", error);
    return null;
  }
};

const applyForJob = async (db, auth, job, source) => {
  const user = auth.currentUser;
  if (!user) {
    storePendingApplication({ job, source }, "jobs.html");
    alert("Please log in before applying.");
    window.location.href = "login.html?redirect=jobs.html";
    return { ok: false, redirected: true };
  }

  const profile = await getUserProfile(db, user);
  const applicationId = `${user.uid}__${job.id}`;
  const applicationRef = doc(db, "jobApplications", applicationId);

  const payload = {
    applicationId,
    userId: user.uid,
    applicantName: profile?.fullName || user.displayName || "Job Matrix User",
    applicantEmail: profile?.email || user.email || "",
    applicantPhone: profile?.phone || "",
    applicantRole: profile?.role || "user",
    jobId: job.id,
    jobTitle: job.title || "",
    jobCompany: job.company || "",
    jobLocation: job.location || "",
    jobSalary: job.salary || "",
    jobType: normalizeJobType(job.type),
    jobDate: job.date || "",
    jobDescription: job.description || "",
    source: mapSourceLabel(source),
    sourcePage: source,
    appliedAt: serverTimestamp(),
  };

  await setDoc(applicationRef, payload);
  clearPendingApplication();
  sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
  return { ok: true };
};

const renderJobsList = (jobs) => {
  const grid = document.getElementById("jobsGrid");
  const emptyState = document.getElementById("jobsEmpty");
  const searchInput = document.getElementById("jobsSearchInput");
  const typeFilter = document.getElementById("jobsTypeFilter");
  if (!grid || !searchInput || !typeFilter) return;

  const queryText = searchInput.value.trim().toLowerCase();
  const selectedType = typeFilter.value.trim().toLowerCase();
  const filteredJobs = jobs.filter((job) => {
    const type = String(job.type || "").toLowerCase();
    const blob = `${job.title} ${job.company} ${job.location} ${job.salary} ${job.description}`.toLowerCase();
    const matchesType = selectedType === "all types" || selectedType === type;
    const matchesQuery = !queryText || blob.includes(queryText);
    return matchesType && matchesQuery;
  });

  grid.innerHTML = filteredJobs.map((job) => createJobCardMarkup(job)).join("");
  if (emptyState) emptyState.hidden = filteredJobs.length !== 0;
};

const setupJobsPage = (db, auth) => {
  if (!document.body.classList.contains("jobs-page")) return;

  const grid = document.getElementById("jobsGrid");
  const searchInput = document.getElementById("jobsSearchInput");
  const typeFilter = document.getElementById("jobsTypeFilter");
  const searchBtn = document.getElementById("jobsSearchBtn");
  if (!grid || !searchInput || !typeFilter || !searchBtn) return;

  let firestoreJobs = [];
  let currentJobs = [...defaultJobsData];

  const refresh = () => {
    currentJobs = [...firestoreJobs, ...defaultJobsData];
    renderJobsList(currentJobs);
  };

  searchBtn.addEventListener("click", refresh);
  searchInput.addEventListener("input", refresh);
  typeFilter.addEventListener("change", refresh);
  refresh();

  grid.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-apply-job-id]");
    if (!button) return;

    const jobId = button.getAttribute("data-apply-job-id");
    const selectedJob = currentJobs.find((job) => String(job.id) === String(jobId));
    if (!selectedJob) return;

    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = "Applying...";

    try {
      const result = await applyForJob(db, auth, selectedJob, "jobs-page");
      if (result.redirected) return;
      alert("Your application was submitted successfully.");
    } catch (error) {
      console.error("Jobs page apply error:", error);
      alert("The application could not be submitted. Please check your Firestore rules.");
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    const pendingApplication = readPendingApplication();
    if (!pendingApplication?.job || pendingApplication.source !== "jobs-page") return;

    try {
      const result = await applyForJob(db, auth, pendingApplication.job, pendingApplication.source);
      if (result.ok) {
        alert("Your application was submitted successfully after login.");
      }
    } catch (error) {
      console.error("Pending jobs page application error:", error);
    }
  });

  const jobsQuery = query(collection(db, "jobs"), orderBy("createdAt", "desc"));
  onSnapshot(
    jobsQuery,
    (snapshot) => {
      firestoreJobs = snapshot.docs.map((jobDoc) => ({
        id: jobDoc.id,
        ...jobDoc.data(),
      }));
      refresh();
    },
    (error) => {
      console.error("Jobs fetch error:", error);
      refresh();
    }
  );
};

const setupAdminJobs = (db, auth) => {
  if (!document.body.classList.contains("admin-page")) return;

  const form = document.getElementById("adminJobForm");
  const message = document.getElementById("adminJobMessage");
  const postedJobsWrap = document.getElementById("adminPostedJobs");
  const clearBtn = document.getElementById("adminClearJobs");
  if (!form || !message || !postedJobsWrap || !clearBtn) return;
  if (form.dataset.firebaseJobsBound === "true") return;
  form.dataset.firebaseJobsBound = "true";

  const setMessage = (text, isError = false) => {
    message.textContent = text;
    message.style.color = isError ? "#b42318" : "";
  };

  const renderAdminPostedJobs = (jobs) => {
    if (!jobs.length) {
      postedJobsWrap.innerHTML = "<article><p>No admin jobs posted yet.</p></article>";
      return;
    }

    postedJobsWrap.innerHTML = jobs
      .map(
        (job) => `
          <article>
            <h3>${escapeHtml(job.title)}</h3>
            <p>${escapeHtml(job.type)} | ${escapeHtml(job.company)} | ${escapeHtml(job.location)}</p>
            <p>${escapeHtml(job.salary)} | ${escapeHtml(job.date)}</p>
            <button type="button" class="admin-delete-btn" data-delete-job-id="${escapeHtml(
              job.id
            )}">Delete Job</button>
          </article>
        `
      )
      .join("");
  };

  const jobsRef = collection(db, "jobs");
  const jobsQuery = query(jobsRef, orderBy("createdAt", "desc"));
  onSnapshot(
    jobsQuery,
    (snapshot) => {
      const jobs = snapshot.docs.map((jobDoc) => ({
        id: jobDoc.id,
        ...jobDoc.data(),
      }));
      renderAdminPostedJobs(jobs);
    },
    (error) => {
      console.error("Admin jobs fetch error:", error);
      setMessage("Jobs could not be loaded. Please check your Firestore rules.", true);
    }
  );

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      setMessage("Admin login is required first.", true);
      return;
    }

    const typeInput = document.getElementById("adminJobType");
    const dateInput = document.getElementById("adminJobDate");
    const titleInput = document.getElementById("adminJobTitle");
    const companyInput = document.getElementById("adminJobCompany");
    const locationInput = document.getElementById("adminJobLocation");
    const salaryInput = document.getElementById("adminJobSalary");
    const descriptionInput = document.getElementById("adminJobDescription");
    if (
      !typeInput ||
      !dateInput ||
      !titleInput ||
      !companyInput ||
      !locationInput ||
      !salaryInput ||
      !descriptionInput
    ) {
      return;
    }

    const dateValue = dateInput.value || new Date().toISOString().slice(0, 10);
    const newJob = {
      type: normalizeJobType(typeInput.value),
      date: formatJobDate(dateValue),
      dateValue,
      title: titleInput.value.trim(),
      company: companyInput.value.trim(),
      location: locationInput.value.trim(),
      salary: salaryInput.value.trim(),
      description: descriptionInput.value.trim(),
      postedBy: user.uid,
      createdAt: serverTimestamp(),
    };

    try {
      setMessage("Saving the job to Firebase...");
      await addDoc(jobsRef, newJob);
      form.reset();
      setMessage("The job was posted successfully. It is now visible in Firebase and on the Jobs page.");
    } catch (error) {
      console.error("Job post error:", error);
      setMessage("The job could not be saved. Please check your Firestore write rules.", true);
    }
  });

  postedJobsWrap.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-delete-job-id]");
    if (!button) return;

    const jobId = button.getAttribute("data-delete-job-id");
    if (!jobId) return;

    const confirmed = window.confirm("Delete this job?");
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "jobs", jobId));
      setMessage("The selected job was deleted successfully.");
    } catch (error) {
      console.error("Job delete error:", error);
      setMessage("The job could not be deleted. Please check your Firestore rules.", true);
    }
  });

  clearBtn.addEventListener("click", async () => {
    const confirmed = window.confirm("Do you want to delete all admin-posted jobs?");
    if (!confirmed) return;

    try {
      setMessage("Deleting all jobs...");
      const snapshot = await getDocs(jobsRef);
      await Promise.all(snapshot.docs.map((jobDoc) => deleteDoc(doc(db, "jobs", jobDoc.id))));
      setMessage("All admin-posted jobs were deleted successfully.");
    } catch (error) {
      console.error("Clear jobs error:", error);
      setMessage("All jobs could not be cleared. Please check your Firestore rules.", true);
    }
  });
};

if (isConfigValid) {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  setupJobsPage(db, auth);

  if (document.body.classList.contains("admin-page")) {
    onAuthStateChanged(auth, () => {
      setupAdminJobs(db, auth);
    });
  }
} else if (document.body.classList.contains("jobs-page")) {
  renderJobsList(defaultJobsData);
}
