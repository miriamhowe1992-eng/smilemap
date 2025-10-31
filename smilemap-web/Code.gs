# --- STEP 1: Store your real Web App URL (replace the line below with YOURS) ---
# Example format (replace everything inside the quotes with your actual URL that ends in /exec)
WEBHOOK="https://script.google.com/macros/s/AKfycbylH9UiBQcD3qZr9NrYOo2YQixFhiE6VaMtKBtCV03A_LHxPMuoW4-7Yz6lfVm4r6YCvg/exec"

# --- STEP 2: Check GET endpoint (should return {"ok":true,"ping":"smilemap"}) ---
curl -L "$WEBHOOK"

# --- STEP 3: Test POST endpoint (should return {"ok":true} and write a new row in your Google Sheet) ---
curl -L -X POST "$WEBHOOK" \
  -H "Content-Type: application/json" \
  -d '{
    "practiceId":"test",
    "practiceName":"Webhook Test",
    "practiceAddress":"123 Test St",
    "status":"GREEN",
    "patientName":"Tester",
    "patientEmail":"test@example.com",
    "patientPhone":"07123456789",
    "postcode":"SW1A 1AA",
    "notes":"hello",
    "consent":true
  }'
