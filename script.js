const menuToggle = document.getElementById("menuToggle");
const menu = document.getElementById("menu");

if (menuToggle && menu) {
  menuToggle.addEventListener("click", () => {
    menu.classList.toggle("open");
  });
}

const aboutMenuItems = Array.from(document.querySelectorAll(".menu-item-about"));
if (aboutMenuItems.length) {
  const isMobileMenu = () => window.matchMedia("(max-width: 980px)").matches;

  aboutMenuItems.forEach((item) => {
    const closeBtn = item.querySelector(".about-dropdown-close");
    const aboutLink = item.querySelector(":scope > a");

    if (closeBtn) {
      closeBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        item.classList.remove("force-open");
        item.classList.add("force-closed");
      });
    }

    if (aboutLink) {
      aboutLink.addEventListener("click", (event) => {
        if (!isMobileMenu()) return;
        event.preventDefault();
        event.stopPropagation();
        const isOpen = item.classList.contains("force-open");
        if (isOpen) {
          item.classList.remove("force-open");
          item.classList.add("force-closed");
        } else {
          item.classList.remove("force-closed");
          item.classList.add("force-open");
        }
      });
    }

    item.addEventListener("mouseenter", () => {
      if (isMobileMenu()) return;
      item.classList.remove("force-closed");
      item.classList.add("force-open");
    });
  });
}

const slider = document.getElementById("indiaSlider");
const dotsWrap = document.getElementById("indiaSliderDots");

if (slider && dotsWrap) {
  const slides = Array.from(slider.querySelectorAll(".india-slide"));
  const dots = Array.from(dotsWrap.querySelectorAll("button"));
  let currentIndex = 0;

  const showSlide = (index) => {
    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === index);
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
    });
    currentIndex = index;
  };

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      showSlide(index);
    });
  });

  setInterval(() => {
    const next = (currentIndex + 1) % slides.length;
    showSlide(next);
  }, 3500);
}

const plansToggle = document.getElementById("plansToggle");
const plansDropdown = document.getElementById("plansDropdown");

if (plansDropdown) {
  if (plansToggle) {
    plansToggle.addEventListener("click", () => {
      const isHidden = plansDropdown.hasAttribute("hidden");
      if (isHidden) {
        plansDropdown.removeAttribute("hidden");
        plansToggle.setAttribute("aria-expanded", "true");
      } else {
        plansDropdown.setAttribute("hidden", "");
        plansToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  const tabButtons = Array.from(plansDropdown.querySelectorAll("[data-plan-tab]"));
  const panels = Array.from(plansDropdown.querySelectorAll("[data-plan-panel]"));

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.getAttribute("data-plan-tab");
      tabButtons.forEach((tab) => {
        tab.classList.toggle("active", tab === button);
      });
      panels.forEach((panel) => {
        const match = panel.getAttribute("data-plan-panel") === target;
        panel.classList.toggle("active", match);
        panel.hidden = !match;
      });
    });
  });

  const planMoreButtons = Array.from(plansDropdown.querySelectorAll(".plan-more-btn"));
  planMoreButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".plan-card");
      if (!card) return;
      const expanded = card.classList.toggle("expanded");
      btn.setAttribute("aria-expanded", expanded ? "true" : "false");
      btn.textContent = expanded ? "Show Less" : "Know More";
    });
  });
}

const seatNodes = Array.from(document.querySelectorAll(".seat-count"));

if (seatNodes.length) {
  const STORAGE_KEY = "jm_prepaid_seat_state_v1";
  const DECREMENT_EVERY_MS = 52 * 60 * 60 * 1000;
  const DECREMENT_BY = 3;

  const now = Date.now();
  let state = {};

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state = raw ? JSON.parse(raw) : {};
  } catch {
    state = {};
  }

  const applySeatDisplay = (el, seats) => {
    el.textContent = `${seats} seats left`;
    el.classList.toggle("low-seat", seats < 10);
  };

  seatNodes.forEach((el) => {
    const key = el.getAttribute("data-plan-key");
    const initial = Number(el.getAttribute("data-initial-seats")) || 0;
    if (!key || !initial) return;

    if (!state[key]) {
      state[key] = {
        initial,
        seats: initial,
        lastTick: now,
      };
    }

    const item = state[key];
    let seats = Number(item.seats) || initial;
    let lastTick = Number(item.lastTick) || now;
    const intervals = Math.floor((now - lastTick) / DECREMENT_EVERY_MS);

    if (intervals > 0) {
      for (let i = 0; i < intervals; i += 1) {
        seats -= DECREMENT_BY;
        if (seats <= 3) {
          seats = initial;
        }
      }
      lastTick += intervals * DECREMENT_EVERY_MS;
    }

    state[key] = {
      initial,
      seats,
      lastTick,
    };

    applySeatDisplay(el, seats);
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  setInterval(() => {
    const tickNow = Date.now();
    let changed = false;

    seatNodes.forEach((el) => {
      const key = el.getAttribute("data-plan-key");
      if (!key || !state[key]) return;

      let seats = state[key].seats;
      let lastTick = state[key].lastTick;
      const initial = state[key].initial;
      const intervals = Math.floor((tickNow - lastTick) / DECREMENT_EVERY_MS);

      if (intervals > 0) {
        for (let i = 0; i < intervals; i += 1) {
          seats -= DECREMENT_BY;
          if (seats <= 3) {
            seats = initial;
          }
        }
        lastTick += intervals * DECREMENT_EVERY_MS;
        state[key] = { initial, seats, lastTick };
        changed = true;
      }

      applySeatDisplay(el, seats);
    });

    if (changed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, 60 * 1000);
}

const JOBS_STORAGE_KEY = "jm_admin_jobs_v1";
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

const readAdminJobs = () => {
  try {
    const raw = localStorage.getItem(JOBS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveAdminJobs = (jobs) => {
  localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
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
      <button class="job-apply-btn">Apply Now</button>
    </article>
  `;
};

const setupJobsPage = () => {
  if (!document.body.classList.contains("jobs-page")) return;

  const grid = document.getElementById("jobsGrid");
  const emptyState = document.getElementById("jobsEmpty");
  const searchInput = document.getElementById("jobsSearchInput");
  const typeFilter = document.getElementById("jobsTypeFilter");
  const searchBtn = document.getElementById("jobsSearchBtn");
  if (!grid || !searchInput || !typeFilter || !searchBtn) return;

  const adminJobs = readAdminJobs();
  const allJobs = [...adminJobs, ...defaultJobsData];

  const render = (list) => {
    grid.innerHTML = list.map((job) => createJobCardMarkup(job)).join("");
    if (emptyState) emptyState.hidden = list.length !== 0;
  };

  const applyFilter = () => {
    const query = searchInput.value.trim().toLowerCase();
    const selectedType = typeFilter.value.trim().toLowerCase();

    const filtered = allJobs.filter((job) => {
      const type = String(job.type || "").toLowerCase();
      const matchType = selectedType === "all types" || selectedType === type;
      const blob = `${job.title} ${job.company} ${job.location} ${job.salary} ${job.description}`.toLowerCase();
      const matchQuery = !query || blob.includes(query);
      return matchType && matchQuery;
    });

    render(filtered);
  };

  render(allJobs);
  searchBtn.addEventListener("click", applyFilter);
  searchInput.addEventListener("input", applyFilter);
  typeFilter.addEventListener("change", applyFilter);
};

const setupAdminPage = () => {
  if (!document.body.classList.contains("admin-page")) return;

  const form = document.getElementById("adminJobForm");
  const message = document.getElementById("adminJobMessage");
  const postedJobsWrap = document.getElementById("adminPostedJobs");
  const clearBtn = document.getElementById("adminClearJobs");
  if (!form || !postedJobsWrap || !clearBtn || !message) return;

  const renderAdminPostedJobs = () => {
    const adminJobs = readAdminJobs();
    if (!adminJobs.length) {
      postedJobsWrap.innerHTML = "<article><p>No admin jobs posted yet.</p></article>";
      return;
    }

    postedJobsWrap.innerHTML = adminJobs
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

  form.addEventListener("submit", (event) => {
    event.preventDefault();

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

    const today = new Date().toLocaleDateString("en-IN");
    const selectedDate = dateInput.value
      ? new Date(dateInput.value).toLocaleDateString("en-IN")
      : today;

    const newJob = {
      id: `admin-${Date.now()}`,
      type: normalizeJobType(typeInput.value),
      date: selectedDate,
      title: titleInput.value.trim(),
      company: companyInput.value.trim(),
      location: locationInput.value.trim(),
      salary: salaryInput.value.trim(),
      description: descriptionInput.value.trim(),
    };

    const adminJobs = readAdminJobs();
    adminJobs.unshift(newJob);
    saveAdminJobs(adminJobs);

    form.reset();
    message.textContent = "Job posted successfully. It is now visible on the Jobs page.";
    renderAdminPostedJobs();
  });

  clearBtn.addEventListener("click", () => {
    localStorage.removeItem(JOBS_STORAGE_KEY);
    message.textContent = "All admin posted jobs cleared.";
    renderAdminPostedJobs();
  });

  postedJobsWrap.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-job-id]");
    if (!button) return;

    const deleteId = button.getAttribute("data-delete-job-id");
    if (!deleteId) return;

    const adminJobs = readAdminJobs();
    const updatedJobs = adminJobs.filter((job) => String(job.id) !== String(deleteId));
    saveAdminJobs(updatedJobs);
    message.textContent = "Selected job deleted successfully.";
    renderAdminPostedJobs();
  });

  renderAdminPostedJobs();
};

setupJobsPage();
setupAdminPage();

const aboutHeroMore = document.getElementById("aboutHeroMore");
const aboutHeroPreviewMore = document.getElementById("aboutHeroPreviewMore");

if (aboutHeroMore && aboutHeroPreviewMore) {
  aboutHeroMore.addEventListener("click", () => {
    const isExpanded = aboutHeroPreviewMore.classList.toggle("is-visible");
    aboutHeroMore.textContent = isExpanded ? "Show Less" : "Know More";
  });
}

const revealSelector = [
  "section",
  "article",
  "h1",
  "h2",
  "h3",
  "p",
  "img",
  "button",
  "label",
  "li",
  ".service-card",
  ".service-offer-card",
  ".plan-card",
  ".job-card",
  ".milestone-card",
  ".contact-info-card",
  ".contact-form-card",
  ".why-card",
  ".values-grid article",
  ".testimonial-grid article",
].join(", ");

const revealElements = Array.from(document.querySelectorAll(revealSelector)).filter(
  (el) =>
    !el.closest(".site-header") &&
    !el.closest(".india-slider-frame") &&
    !el.closest(".india-slider-dots") &&
    !el.classList.contains("menu-toggle") &&
    !el.classList.contains("reveal-on-scroll")
);

if (revealElements.length) {
  revealElements.forEach((el, index) => {
    el.classList.add("reveal-on-scroll");
    el.style.transitionDelay = `${Math.min((index % 8) * 0.06, 0.42)}s`;
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            entry.target.style.transitionDelay = "0s";
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    revealElements.forEach((el) => observer.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add("is-visible"));
  }
}
