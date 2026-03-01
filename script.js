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
