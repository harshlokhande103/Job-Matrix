const menuToggle = document.getElementById("menuToggle");
const menu = document.getElementById("menu");

if (menuToggle && menu) {
  menuToggle.addEventListener("click", () => {
    menu.classList.toggle("open");
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

if (plansToggle && plansDropdown) {
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

  const infoMeta = Array.from(plansDropdown.querySelectorAll(".plan-meta"));
  infoMeta.forEach((meta) => {
    const infoBtn = meta.querySelector(".info-btn");
    if (!infoBtn) return;

    infoBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      const wasOpen = meta.classList.contains("show-tip");
      infoMeta.forEach((item) => item.classList.remove("show-tip"));
      if (!wasOpen) meta.classList.add("show-tip");
    });
  });

  document.addEventListener("click", () => {
    infoMeta.forEach((item) => item.classList.remove("show-tip"));
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
