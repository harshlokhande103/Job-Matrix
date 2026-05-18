# WhatsApp Enquiry To Google Sheet Setup

This project already sends the WhatsApp enquiry form data to a Google Apps Script Web App URL.
To make entries appear in your Google Sheet, do these steps once.

## 1. Create/Open Google Sheet

Your enquiry data will be saved in this Google Sheet:

`https://docs.google.com/spreadsheets/d/199r56kgOHXheABEToOOod78bJrGDdsdcBEvNIk7PXSk/edit`

## 2. Open Apps Script

In Google Sheet, go to:

`Extensions > Apps Script`

Paste the code from `google-sheet-enquiry-apps-script.js`.

That file already contains your Sheet ID:

```js
const SPREADSHEET_ID = "199r56kgOHXheABEToOOod78bJrGDdsdcBEvNIk7PXSk";
```

## 3. Deploy Web App

In Apps Script:

1. Click `Deploy`
2. Click `New deployment`
3. Select type: `Web app`
4. Execute as: `Me`
5. Who has access: `Anyone`
6. Click `Deploy`
7. Copy the Web App URL

## 4. Add URL In Website

Open `script.js` and paste the URL here:

```js
const ENQUIRY_SHEET_WEB_APP_URL = "PASTE_WEB_APP_URL_HERE";
```

After this, every submitted enquiry form will add this data to your sheet:

- Received At
- Name
- Email
- Phone
- Page
- Created At

The WhatsApp chat will still open after submit with the same details prefilled.
