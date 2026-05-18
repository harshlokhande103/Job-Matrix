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

  sheet.appendRow([
    new Date(),
    data.name || "",
    data.phone || "",
    data.email || "",
    data.cityState || "",
    data.bpoKpoExperience || "",
    data.experience || "",
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

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Received At",
      "Name",
      "Contact No",
      "Email ID",
      "City/State",
      "BPO/KPO Experience",
      "Experience",
      "Page",
      "Created At",
    ]);
  }

  return sheet;
}
