import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
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

const createDashboardJobMarkup = (job) => {
  const type = escapeHtml(normalizeJobType(job.type));
  const date = escapeHtml(job.date || "Recently added");
  const title = escapeHtml(job.title || "Open Role");
  const company = escapeHtml(job.company || "Job Matrix Partner");
  const location = escapeHtml(job.location || "Location not specified");
  const salary = escapeHtml(job.salary || "Salary not specified");
  const description = escapeHtml(job.description || "Details will be shared after application.");
  const mutedClass = type.toLowerCase() === "remote" ? " muted" : "";

  return `
    <article class="job-card">
      <div class="job-card-head">
        <span class="job-type${mutedClass}">${type}</span>
        <span class="job-date">${date}</span>
      </div>
      <h3>${title}</h3>
      <ul class="job-meta">
        <li>&#127970; ${company}</li>
        <li>&#128205; ${location}</li>
        <li>&#8377; ${salary}</li>
      </ul>
      <p>${description}</p>
      <button class="job-apply-btn" type="button" data-apply-job-id="${escapeHtml(job.id)}">Apply Now</button>
    </article>
  `;
};

const createAppliedJobMarkup = (application) => {
  const type = escapeHtml(normalizeJobType(application.jobType));
  const date = escapeHtml(application.jobDate || "Recently applied");
  const title = escapeHtml(application.jobTitle || "Open Role");
  const company = escapeHtml(application.jobCompany || "Job Matrix Partner");
  const location = escapeHtml(application.jobLocation || "Location not specified");
  const salary = escapeHtml(application.jobSalary || "Salary not specified");
  const description = escapeHtml(
    application.jobDescription || "Application submitted successfully for this role."
  );
  const mutedClass = type.toLowerCase() === "remote" ? " muted" : "";
  const appliedAt = escapeHtml(formatCreatedAt(application.appliedAt));

  return `
    <article class="job-card is-applied">
      <div class="job-card-head">
        <span class="job-type${mutedClass}">${type}</span>
        <span class="job-date">${date}</span>
      </div>
      <h3>${title}</h3>
      <ul class="job-meta">
        <li>&#127970; ${company}</li>
        <li>&#128205; ${location}</li>
        <li>&#8377; ${salary}</li>
      </ul>
      <p>${description}</p>
      <button class="job-apply-btn is-applied" type="button" disabled>
        Applied On ${appliedAt}
      </button>
    </article>
  `;
};

const renderDashboardJobs = (jobs, statusText) => {
  const jobsGrid = document.getElementById("dashboardJobsGrid");
  const jobsEmpty = document.getElementById("dashboardJobsEmpty");
  const jobsStatus = document.getElementById("dashboardJobsStatus");
  if (!jobsGrid || !jobsEmpty || !jobsStatus) return;

  jobsStatus.textContent = statusText;
  jobsGrid.innerHTML = jobs.map((job) => createDashboardJobMarkup(job)).join("");
  jobsEmpty.hidden = jobs.length !== 0;
};

const renderAppliedJobs = (applications, statusText) => {
  const appliedJobsGrid = document.getElementById("dashboardAppliedJobsGrid");
  const appliedJobsEmpty = document.getElementById("dashboardAppliedJobsEmpty");
  const appliedJobsStatus = document.getElementById("dashboardAppliedJobsStatus");
  if (!appliedJobsGrid || !appliedJobsEmpty || !appliedJobsStatus) return;

  appliedJobsStatus.textContent = statusText;
  appliedJobsGrid.innerHTML = applications.map((item) => createAppliedJobMarkup(item)).join("");
  appliedJobsEmpty.hidden = applications.length !== 0;
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
  sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
};

const mapSourceLabel = (value) => {
  if (value === "dashboard") return "Dashboard";
  if (value === "jobs-page") return "Jobs Page";
  return "Website";
};

const applyForJob = async (db, user, profile, job, source) => {
  if (!user) return { ok: false };

  const applicationId = `${user.uid}__${job.id}`;
  const applicationRef = doc(db, "jobApplications", applicationId);

  await setDoc(applicationRef, {
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
  });

  clearPendingApplication();
  return { ok: true };
};

const subscribeDashboardJobs = (db, onJobsChange) => {
  renderDashboardJobs(defaultJobsData, `Showing ${defaultJobsData.length} jobs.`);
  onJobsChange([...defaultJobsData]);

  const jobsQuery = query(collection(db, "jobs"), orderBy("createdAt", "desc"));
  onSnapshot(
    jobsQuery,
    (snapshot) => {
      const firestoreJobs = snapshot.docs.map((jobDoc) => ({
        id: jobDoc.id,
        ...jobDoc.data(),
      }));
      const jobs = [...firestoreJobs, ...defaultJobsData];
      renderDashboardJobs(jobs, `Showing ${jobs.length} jobs.`);
      onJobsChange(jobs);
    },
    (error) => {
      console.error("Dashboard jobs fetch error:", error);
      renderDashboardJobs(
        defaultJobsData,
        "Latest jobs load nahi ho pa rahi hain. Default jobs dikh rahi hain."
      );
      onJobsChange([...defaultJobsData]);
    }
  );
};

const subscribeAppliedJobs = (db, userId) => {
  if (!userId) return;

  renderAppliedJobs([], "Loading applied jobs...");
  const appliedJobsQuery = query(collection(db, "jobApplications"), where("userId", "==", userId));

  onSnapshot(
    appliedJobsQuery,
    (snapshot) => {
      const applications = snapshot.docs
        .map((docSnap) => ({
          docId: docSnap.id,
          ...docSnap.data(),
        }))
        .sort((first, second) => {
          const firstTime =
            typeof first.appliedAt?.toDate === "function"
              ? first.appliedAt.toDate().getTime()
              : new Date(first.appliedAt || 0).getTime();
          const secondTime =
            typeof second.appliedAt?.toDate === "function"
              ? second.appliedAt.toDate().getTime()
              : new Date(second.appliedAt || 0).getTime();
          return secondTime - firstTime;
        });
      renderAppliedJobs(applications, `Showing ${applications.length} applied jobs.`);
    },
    (error) => {
      console.error("Applied jobs fetch error:", error);
      renderAppliedJobs([], "Applied jobs load nahi ho pa rahi hain.");
    }
  );
};

if (!hasValidFirebaseConfig()) {
  window.location.href = "login.html";
} else {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const logoutBtn = document.getElementById("dashboardLogoutBtn");
  const jobsGrid = document.getElementById("dashboardJobsGrid");
  let currentJobs = [...defaultJobsData];
  let currentUser = null;
  let currentProfile = null;

  subscribeDashboardJobs(db, (jobs) => {
    currentJobs = jobs;
  });

  if (jobsGrid) {
    jobsGrid.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-apply-job-id]");
      if (!button || !currentUser) return;

      const jobId = button.getAttribute("data-apply-job-id");
      const selectedJob = currentJobs.find((job) => String(job.id) === String(jobId));
      if (!selectedJob) return;

      button.disabled = true;
      const originalText = button.textContent;
      button.textContent = "Applying...";

      try {
        const result = await applyForJob(db, currentUser, currentProfile, selectedJob, "dashboard");
        if (result.ok) {
          renderDashboardJobs(currentJobs, "Application successfully submit ho gayi.");
        }
      } catch (error) {
        console.error("Dashboard apply error:", error);
        renderDashboardJobs(currentJobs, "Application submit nahi ho paayi. Firestore rules check karo.");
      } finally {
        button.disabled = false;
        button.textContent = originalText;
      }
    });
  }

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

    currentUser = user;
    subscribeAppliedJobs(db, user.uid);

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
    currentProfile = profile || null;

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

    const pendingApplication = readPendingApplication();
    if (pendingApplication?.job) {
      try {
        const result = await applyForJob(
          db,
          user,
          profile,
          pendingApplication.job,
          pendingApplication.source || "jobs-page"
        );
        if (result.ok) {
          renderDashboardJobs(currentJobs, "Pending job application successfully submit ho gayi.");
        }
      } catch (error) {
        console.error("Pending dashboard application error:", error);
        renderDashboardJobs(currentJobs, "Pending application submit nahi ho paayi.");
      }
    }
  });
}
