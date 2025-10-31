// Code.gs

// Simple ping so we can verify the deployment quickly.
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, ping: "smilemap" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    // ⬅️ Replace with your real Sheet ID (just the long ID)
    var sheet = SpreadsheetApp.openById('1HnTPMHUXszlUqpkCJ0odngjOyx3OrWBnDkwRzPvRSeA')
                              .getSheetByName('Leads');
    if (!sheet) throw new Error("Sheet tab 'Leads' not found");

    var bodyText = e && e.postData && e.postData.contents ? e.postData.contents : "";
    var data = bodyText ? JSON.parse(bodyText) : {};

    sheet.appendRow([
      new Date(),                         // ts
      data.practiceId || "",              // practiceId
      data.practiceName || "",            // practiceName
      data.practiceAddress || "",         // practiceAddress
      data.status || "",                  // status
      data.patientName || "",             // patientName
      data.patientEmail || "",            // patientEmail
      data.patientPhone || "",            // patientPhone
      data.postcode || "",                // postcode
      data.notes || "",                   // notes
      data.consent ? "TRUE" : "FALSE",    // consent
      data.ua || "",                      // ua
      data.referer || "",                 // referer
      data.source || "smilemap"           // source
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
