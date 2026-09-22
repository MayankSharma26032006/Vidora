import nodemailer from "nodemailer";

/**
 * Email delivery with a provider switch. Controllers always call
 * sendMail({ to, subject, text, html }) and never need to know which
 * provider is active.
 *
 * Resolution order (first configured wins):
 *   1. RESEND_API_KEY  → Resend REST API (https://api.resend.com/emails)
 *   2. EMAILJS_*       → EmailJS REST API (server-side call with private key)
 *   3. SMTP_*          → nodemailer
 *   4. none            → console log (dev fallback)
 *
 * ── Free-tier limits (as of Sep 2026) ─────────────────────────────────────
 *   Resend : 100 emails/day · 3,000/month
 *   EmailJS: ~200 emails/month (subscription-based, no daily cap)
 * ──────────────────────────────────────────────────────────────────────────
 *
 * ── Resend sender address ─────────────────────────────────────────────────
 * Sending from a custom address (e.g. no-reply@vidora.app) requires a verified
 * domain in the Resend dashboard (DNS records). Until that is set up, the
 * shared test sender `onboarding@resend.dev` is used — emails will show a
 * generic Resend "from" address. This is expected, NOT a bug. Resend also
 * only delivers to the account owner's own email address while using the
 * test sender, so use your own inbox when testing signups.
 * ──────────────────────────────────────────────────────────────────────────
 */

const RESEND_TEST_FROM = "onboarding@resend.dev";

function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

function isEmailJsConfigured() {
  return Boolean(
    process.env.EMAILJS_SERVICE_ID &&
    process.env.EMAILJS_TEMPLATE_ID &&
    process.env.EMAILJS_PUBLIC_KEY &&
    process.env.EMAILJS_PRIVATE_KEY
  );
}

function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/** True when ANY real delivery provider is configured (used for UI hints). */
export function isEmailDeliveryConfigured() {
  return isResendConfigured() || isEmailJsConfigured() || isSmtpConfigured();
}

let transporter = null;

function getSmtpTransporter() {
  if (!transporter) {
    console.log(
      `[mailer] SMTP configured host=${process.env.SMTP_HOST} port=${Number(process.env.SMTP_PORT) || 587} secure=${process.env.SMTP_SECURE === "true"} user=${process.env.SMTP_USER}`
    );
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });
  }
  return transporter;
}

async function sendViaResend({ to, subject, text, html }) {
  // Custom domains require DNS verification; until then use the shared test
  // sender. See the note in the header comment above.
  const from = process.env.RESEND_FROM || RESEND_TEST_FROM;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text, html }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend API error ${res.status}: ${body.slice(0, 300)}`);
  }
}

async function sendViaEmailJs({ to, subject, text, html }) {
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      // Private key — required for server-side (non-browser) calls.
      accessToken: process.env.EMAILJS_PRIVATE_KEY,
      template_params: {
        to_email: to,
        subject,
        text,
        html,
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`EmailJS API error ${res.status}: ${body.slice(0, 300)}`);
  }
}

export async function sendMail({ to, subject, text, html }) {
  if (isResendConfigured()) {
    await sendViaResend({ to, subject, text, html });
    return;
  }
  if (isEmailJsConfigured()) {
    await sendViaEmailJs({ to, subject, text, html });
    return;
  }
  const smtpReady = isSmtpConfigured();
  if (smtpReady) {
    const transport = getSmtpTransporter();
    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
    });
    return;
  }
  console.log(`[mailer:dev] To: ${to} | Subject: ${subject}`);
  console.log(text || "");
}
