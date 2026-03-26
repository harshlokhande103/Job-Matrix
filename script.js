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

const aboutHeroMore = document.getElementById("aboutHeroMore");
const aboutHeroPreviewMore = document.getElementById("aboutHeroPreviewMore");

if (aboutHeroMore && aboutHeroPreviewMore) {
  aboutHeroMore.addEventListener("click", () => {
    const isExpanded = aboutHeroPreviewMore.classList.toggle("is-visible");
    aboutHeroMore.textContent = isExpanded ? "Show Less" : "Know More";
  });
}

const WHATSAPP_NUMBER = "917649052025";
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hello Job Matrix, I want to know more about your services."
);

if (document.body) {
  const whatsappLink = document.createElement("a");
  whatsappLink.className = "floating-whatsapp";
  whatsappLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;
  whatsappLink.target = "_blank";
  whatsappLink.rel = "noopener noreferrer";
  whatsappLink.setAttribute("aria-label", "Chat with Job Matrix on WhatsApp");
  whatsappLink.innerHTML = `
    <span class="floating-whatsapp-icon" aria-hidden="true">
      <svg viewBox="0 0 32 32" role="img" focusable="false">
        <path fill="currentColor" d="M19.11 17.33c-.27-.14-1.58-.78-1.83-.87-.24-.09-.42-.14-.6.14-.18.27-.69.87-.85 1.05-.15.18-.31.2-.58.07-.27-.14-1.14-.42-2.17-1.34-.8-.71-1.34-1.59-1.49-1.86-.16-.27-.02-.41.11-.54.12-.12.27-.31.4-.47.13-.16.18-.27.27-.45.09-.18.05-.34-.02-.47-.07-.14-.6-1.45-.82-1.99-.22-.52-.44-.45-.6-.46h-.51c-.18 0-.47.07-.72.34s-.94.92-.94 2.24.96 2.59 1.09 2.77c.13.18 1.89 2.89 4.58 4.05.64.28 1.14.45 1.53.58.64.2 1.22.17 1.68.1.51-.08 1.58-.65 1.8-1.27.22-.62.22-1.15.15-1.27-.06-.11-.24-.18-.51-.31Z"/>
        <path fill="currentColor" d="M16.02 3.2c-7 0-12.67 5.67-12.67 12.66 0 2.22.58 4.39 1.68 6.31L3.2 28.8l6.8-1.79a12.62 12.62 0 0 0 6.02 1.53h.01c6.99 0 12.66-5.67 12.66-12.66S23.01 3.2 16.02 3.2Zm0 23.19h-.01a10.5 10.5 0 0 1-5.35-1.47l-.38-.22-4.03 1.06 1.08-3.93-.25-.4a10.5 10.5 0 1 1 8.94 4.96Z"/>
      </svg>
    </span>
    <span class="floating-whatsapp-text">WhatsApp Us</span>
  `;
  document.body.appendChild(whatsappLink);
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
