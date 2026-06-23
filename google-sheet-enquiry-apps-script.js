const SPREADSHEET_ID = "199r56kgOHXheABEToOOod78bJrGDdsdcBEvNIk7PXSk";
const SHEET_NAME = "WhatsApp Enquiries";
const REGISTRATION_SHEET_NAME = "Registrations";

function doPost(e) {
  const data = JSON.parse(e.postData.contents || "{}");

  if (data.formType === "register") {
    return handleRegistration_(data);
  }

  const sheet = getOrCreateSheet_();
  sheet.appendRow([
    new Date(),
    data.name || "",
    data.email || "",
    data.phone || "",
    data.page || "",
    data.createdAt || "",
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleRegistration_(data) {
  const sheet = getOrCreateRegistrationSheet_();
  const job = data.jobAppliedFor || {};
  const appliedJob =
    data.appliedJob ||
    [data.appliedJobTitle || job.title, data.appliedJobCompany || job.company, data.appliedJobLocation || job.location]
      .filter(Boolean)
      .join(" - ");
  const appliedJobDetails =
    data.appliedJobDetails ||
    [
      `Title: ${data.appliedJobTitle || job.title || ""}`,
      `Company: ${data.appliedJobCompany || job.company || ""}`,
      `Location: ${data.appliedJobLocation || job.location || ""}`,
      `Salary: ${data.appliedJobSalary || job.salary || ""}`,
      `Type: ${data.appliedJobType || job.type || ""}`,
      `Date: ${data.appliedJobDate || job.date || ""}`,
      `Description: ${data.appliedJobDescription || job.description || ""}`,
      `Source: ${data.appliedJobSource || job.source || ""}`,
    ].join("\n");

  sheet.appendRow([
    new Date(),
    data.name || "",
    data.phone || "",
    data.email || "",
    data.cityState || "",
    data.bpoKpoExperience || "",
    data.experience || "",
    appliedJob || "",
    appliedJobDetails || "",
    data.appliedJobTitle || job.title || "",
    data.appliedJobCompany || job.company || "",
    data.appliedJobLocation || job.location || "",
    data.appliedJobSalary || job.salary || "",
    data.appliedJobType || job.type || "",
    data.appliedJobDate || job.date || "",
    data.appliedJobSource || job.source || "",
    data.appliedJobDescription || job.description || "",
    data.page || "",
    data.createdAt || "",
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Received At", "Name", "Email", "Phone", "Page", "Created At"]);
  }

  return sheet;
}

function getOrCreateRegistrationSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(REGISTRATION_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(REGISTRATION_SHEET_NAME);
  }

  const headers = [
    "Received At",
    "Name",
    "Contact No",
    "Email ID",
    "City/State",
    "BPO/KPO Experience",
    "Experience",
    "Applied Job",
    "Applied Job Details",
    "Applied Job Title",
    "Applied Job Company",
    "Applied Job Location",
    "Applied Job Salary",
    "Applied Job Type",
    "Applied Job Date",
    "Applied From",
    "Applied Job Description",
    "Page",
    "Created At",
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  return sheet;
}
