import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const transporter = (() => {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
})();

export async function POST(req) {
  try {
    const body = await req.json();
    const { to, subject, body: emailBody, attachments } = body;

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
      attachments: normalizeAttachments(attachments),
    });

    return NextResponse.json({ success: true, message: 'Email sent successfully' });
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
    .map((line) => `<p style="margin:0 0 10px; line-height:1.6;">${escapeHtml(line)}</p>`)
    .join('');

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(subject || 'Full Stack Developer – Afaq Ahmad')}</title>
    <style>
      :root {
        --bg: #f4f7fb;
        --card: #ffffff;
        --primary: #0ea5e9;
        --accent: #10b981;
        --text: #0f172a;
        --muted: #64748b;
        --border: #e5e7eb;
        --shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
      }
      body { margin:0; padding:0; background:var(--bg); font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:var(--text); line-height:1.6; }
      .container { max-width:720px; margin:32px auto; padding:0 16px; }
      .card { background:var(--card); border:1px solid var(--border); border-radius:14px; box-shadow:var(--shadow); overflow:hidden; }
      .banner { background:linear-gradient(135deg,#e0f2fe,#ecfdf3); padding:20px 24px; border-bottom:1px solid var(--border); }
      .banner h1 { margin:6px 0 0; font-size:22px; font-weight:700; color:var(--text); }
      .badge { display:inline-block; padding:4px 10px; border-radius:999px; background:rgba(16,185,129,0.12); color:#047857; font-size:12px; font-weight:700; letter-spacing:0.04em; text-transform:uppercase; }
      .content { padding:24px; }
      .section + .section { margin-top:18px; padding-top:18px; border-top:1px solid var(--border); }
      .section h2 { margin:0 0 8px; font-size:15px; font-weight:700; letter-spacing:0.02em; color:var(--muted); text-transform:uppercase; }
      p { margin:0 0 10px; font-size:15px; }
      ul { margin:8px 0 0; padding-left:18px; }
      ul li { margin:6px 0; font-size:15px; }
      a { color:var(--primary); text-decoration:none; font-weight:600; }
      a:hover { text-decoration:underline; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="card">
        <div class="banner">
          <div class="badge">Application</div>
          <h1>Full Stack Developer – Afaq Ahmad</h1>
        </div>
        <div class="content">
          <div class="section">
            ${paragraphs || '<p style="margin:0 0 10px; color: var(--muted);">Thank you for considering my application.</p>'}
          </div>
        </div>
      </div>
    </div>
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

function normalizeAttachments(attachments) {
  if (!attachments || !Array.isArray(attachments)) return [];
  return attachments
    .map((att) => {
      if (!att || !att.content) return null;
      const contentBase64 = String(att.content).includes('base64,')
        ? String(att.content).split('base64,')[1]
        : String(att.content);
      return {
        filename: att.filename || 'attachment',
        content: contentBase64,
        encoding: 'base64',
        contentType: att.mime || 'application/octet-stream',
      };
    })
    .filter(Boolean);
}
