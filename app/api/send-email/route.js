import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const transporter = (() => {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    return null;
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });
})();

export async function POST(req) {
  try {
    const body = await req.json();
    const { to, subject, body: emailBody } = body;

    const recipients = Array.isArray(to)
      ? to
      : String(to || '')
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean);

    if (!recipients.length || !subject || !emailBody) {
      return NextResponse.json({ error: 'to, subject, and body are required' }, { status: 400 });
    }

    const invalid = recipients.filter((addr) => !emailRegex.test(addr));
    if (invalid.length) {
      return NextResponse.json({ error: `Invalid email(s): ${invalid.join(', ')}` }, { status: 400 });
    }

    if (!transporter) {
      return NextResponse.json({ error: 'Email transport is not configured' }, { status: 500 });
    }

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: recipients,
      subject,
      text: emailBody,
      html: buildHtmlEmail({ subject, body: emailBody }),
    });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
    });
  } catch (error) {
    console.error('Failed to send email', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}

function buildHtmlEmail({ subject, body }) {
  const paragraphs = String(body || '')
    .trim()
    .split(/\n\s*\n|\n/)
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 12px; line-height:1.6;">${escapeHtml(line)}</p>`)
    .join('');

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(subject || 'Application')}</title>
  </head>
  <body style="margin:0; padding:0; background:#f5f7fb; font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="background:#ffffff; border-radius:12px; padding:28px; box-shadow:0 10px 30px rgba(0,0,0,0.08);">
            <tr>
              <td style="padding-bottom:12px;">
                <div style="display:flex; align-items:center; gap:10px;">
                  <div style="width:12px; height:12px; border-radius:50%; background:#10b981;"></div>
                  <div style="font-size:13px; color:#6b7280; text-transform:uppercase; letter-spacing:0.08em;">Application</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:8px;">
                <h1 style="margin:0; font-size:24px; font-weight:700; color:#0f172a;">${escapeHtml(subject || 'Application')}</h1>
              </td>
            </tr>
            <tr>
              <td style="font-size:15px; color:#111827; padding-top:8px;">
                ${paragraphs}
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #e5e7eb; padding-top:16px; margin-top:12px;">
                <p style="margin:0; font-size:13px; color:#6b7280;">Sent via HR Outreach Assistant</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
