const contactForm = document.getElementById("contactForm");
const messageNode = document.getElementById("contactFormMessage");
const submitButton = document.getElementById("contactSubmitBtn");
const CONTACT_SUBMISSIONS_STORAGE_KEY = "jm_contact_submissions_v1";

const setMessage = (text, type = "info") => {
  if (!messageNode) return;
  messageNode.textContent = text;
  messageNode.classList.remove("is-error", "is-success");
  if (type === "error") messageNode.classList.add("is-error");
  if (type === "success") messageNode.classList.add("is-success");
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

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const fullName = document.getElementById("contactName")?.value.trim() || "";
    const email = document.getElementById("contactEmail")?.value.trim() || "";
    const phone = document.getElementById("contactPhone")?.value.trim() || "";
    const category = document.getElementById("contactCategory")?.value.trim() || "General Inquiry";
    const message = document.getElementById("contactMessageField")?.value.trim() || "";

    if (!fullName || !email || !message) {
      setMessage("Please fill name, email, and message.", "error");
      return;
    }

    submitButton.disabled = true;
    setMessage("Sending your message...");

    try {
      const submissions = readContactSubmissions();
      submissions.unshift({
        id: `contact-${Date.now()}`,
        fullName,
        email,
        phone,
        category,
        message,
        createdAt: new Date().toISOString(),
      });
      saveContactSubmissions(submissions);

      contactForm.reset();
      setMessage("Message sent successfully. Our team will contact you soon.", "success");
    } catch (error) {
      console.error("Contact form submit error:", error);
      setMessage("Could not send message right now. Please try again.", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
}
