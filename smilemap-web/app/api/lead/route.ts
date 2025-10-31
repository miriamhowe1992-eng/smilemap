// /app/api/lead/route.ts
import { NextResponse } from "next/server";

const WEBHOOK_URL = process.env.WEBHOOK_URL; // Google Apps Script URL (optional)
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY; // optional
const EMAIL_FROM = process.env.EMAIL_FROM || "SmileMap <no-reply@smilemap.co.uk>";
const EMAIL_BCC = process.env.EMAIL_BCC || ""; // optional internal copy

async function sendEmail(to: string, subject: string, html: string, replyTo?: string) {
  if (!SENDGRID_API_KEY) return;
  await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }], bcc: EMAIL_BCC ? [{ email: EMAIL_BCC }] : undefined }],
      from: { email: EMAIL_FROM.replace(/.*<|>.*/g, "") || "no-reply@smilemap.co.uk", name: EMAIL_FROM.split("<")[0].trim() || "SmileMap" },
      subject,
      reply_to: replyTo ? { email: replyTo } : undefined,
      content: [{ type: "text/html", value: html }],
    }),
  });
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // 1) Forward to your Google Sheet (optional)
    if (WEBHOOK_URL) {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).catch(() => {});
    }

    // 2) Emails (if SENDGRID configured)
    const {
      practiceName,
      practiceEmail,
      practiceAddress,
      status,
      patientName,
      patientEmail,
      patientPhone,
      notes,
    } = data;

    // To practice (or internal BCC only if no practiceEmail)
    if (SENDGRID_API_KEY) {
      const toPractice = practiceEmail || EMAIL_BCC;
      if (toPractice) {
        await sendEmail(
          toPractice,
          `New enquiry via SmileMap – ${patientName}`,
          `
          <h2>New patient enquiry via SmileMap</h2>
          <p><strong>Practice:</strong> ${practiceName || "-"}<br/>
          <strong>Address:</strong> ${practiceAddress || "-"}<br/>
          <strong>NHS status:</strong> ${status || "-"}</p>
          <p><strong>Patient:</strong> ${patientName}<br/>
          <strong>Email:</strong> ${patientEmail || "-"}<br/>
          <strong>Phone:</strong> ${patientPhone || "-"}<br/>
          <strong>Notes:</strong> ${notes || "-"}</p>
          <hr/>
          <p style="color:#64748b;font-size:12px">This enquiry was sent via <strong>SmileMap</strong>.</p>
        `,
          patientEmail || undefined // reply-to patient
        );
      }

      // Confirmation to patient
      if (patientEmail) {
        await sendEmail(
          patientEmail,
          "We’ve sent your request – SmileMap",
          `
          <h2>Thanks ${patientName}, your request is on its way</h2>
          <p>We’ve sent your details to <strong>${practiceName || "the practice"}</strong>.</p>
          <p><strong>What next?</strong><br/>The practice will contact you directly to confirm availability.</p>
          <p style="margin-top:16px;font-size:12px;color:#64748b">Sent via SmileMap • Helping patients find dentists across the UK.</p>
        `
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 500 });
  }
}
