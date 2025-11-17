import { NextResponse } from 'next/server';

const SUBJECT_TEMPLATES = [
  (title) => `Application for ${title}`,
  (title) => `${title} Application - Afaq Ahmad`,
  (title) => `Experienced MERN Developer for ${title}`,
  (title) => `Candidate for ${title} role`,
];

const PROJECT_LINKS = [
  'https://www.filequill.com/',
  'https://job-markaz.vercel.app/',
  'https://pak-draw-by-afaq.vercel.app/',
  'https://maahir-two.vercel.app/',
  'https://pakhtun-exchange.vercel.app/',
  'https://expense-tracker-by-afaq.vercel.app/',
];

function pickProjects() {
  const shuffled = [...PROJECT_LINKS].sort(() => Math.random() - 0.5);
  const count = Math.random() < 0.5 ? 4 : 5;
  return shuffled.slice(0, count);
}

async function generateWithAI({ companyName, jobTitle, jobLink, extraNotes, matchHighlights, keywords }) {
  const title = jobTitle?.trim() || 'Full Stack Developer';
  const company = companyName?.trim();
  const notes = extraNotes?.trim();
  const link = jobLink?.trim();
  const subjectTemplate = SUBJECT_TEMPLATES[Math.floor(Math.random() * SUBJECT_TEMPLATES.length)];
  const subject = subjectTemplate(title);

  const systemPrompt = 'You are a concise job application email writer.';
  const companyLine = company ? `mention the company name "${company}" once` : 'do not mention any company name';
  const linkLine = link ? `You can optionally reference the job link ${link}.` : 'Do not mention a job link.';

  const projects = pickProjects();

  const userPrompt = `Write a concise job application email using this structure:
1) Greeting.
2) Intro: "I'm Afaq Ahmad, a MERN/Next.js developer with 4 years of experience building reliable, secure, high-performance web apps. My core stack: React, Next.js, Node.js, Express, MongoDB, REST APIs."
3) "Recent work:" then list ${projects.length} bullet points (varied wording/order) chosen from: ${projects.join(', ')}.
4) "Match Highlights:" bullet list using: ${Array.isArray(matchHighlights) ? matchHighlights.join('; ') : ''}
5) "My portfolio: https://afaq-resume.vercel.app/"
6) Mention availability: "I'm available immediately for full-time remote, contract, or onsite roles."
7) Close with:
"Best regards,
Afaq Ahmad
WhatsApp: +92 312 9113445
Email: ufaq148@gmail.com"
- Target job title: ${title}.
- ${companyLine}.
- Consider these role keywords if useful: ${keywords || 'n/a'}
- Keep tone professional, direct, and concise. Slightly vary wording each time.
- Use paragraph breaks with \\n.
- ${linkLine}
${notes ? `- Include this note if helpful: ${notes}` : ''}`;

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    return { subject, body: fallbackEmail({ title, company, link, notes, matchHighlights }) };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 320 },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini error: ${response.status}`);
    }

    const data = await response.json();
    const textParts = data.candidates?.[0]?.content?.parts || [];
    const bodyText = textParts.map((p) => p.text || '').join('').trim();
    const sanitized = sanitizeBody(bodyText);

    return { subject, body: sanitized || fallbackEmail({ title, company, link, notes, matchHighlights }) };
  } catch (error) {
    console.error('AI generation failed, using fallback', error);
    return { subject, body: fallbackEmail({ title, company, link, notes, matchHighlights }) };
  }
}

function fallbackEmail({ title, company, link, notes, matchHighlights }) {
  const linkLine = link ? ` I reviewed the role here: ${link}.` : '';
  const notesLine = notes ? ` ${notes.trim()}` : '';

  const projects = pickProjects();
  const recentWork = projects.map((p) => `- ${p}`).join('\n');
  const highlights =
    Array.isArray(matchHighlights) && matchHighlights.length
      ? matchHighlights
      : [
          '✔ 4+ years React/Next.js in production',
          '✔ MERN stack APIs and scalable frontends',
          '✔ Built SaaS dashboards and hiring platforms',
          '✔ Available immediately (remote/contract/onsite)',
        ];

  const body = [
    `Dear Hiring Team${company ? ` at ${company}` : ''},`,
    `I'm Afaq Ahmad, a MERN/Next.js developer with 4 years of experience building reliable, secure, high-performance web apps. My core stack: React, Next.js, Node.js, Express, MongoDB, REST APIs. Applying for the ${title} role${company ? ` at ${company}` : ''}.`,
    `Recent work:\n${recentWork}`,
    `Match Highlights:\n${highlights.map((h) => `- ${h}`).join('\n')}`,
    `My portfolio: https://afaq-resume.vercel.app/`,
    `I'm available immediately for full-time remote, contract, or onsite roles.${linkLine}${notesLine}`,
    `Best regards,
Afaq Ahmad
WhatsApp: +92 312 9113445
Email: ufaq148@gmail.com`,
  ].join('\n\n');

  return sanitizeBody(body);
}

function sanitizeBody(text) {
  const cleaned = String(text || '').replace(/I[\uFFFD�]?Tm/g, "I'm");
  const lines = cleaned.split(/\r?\n/);
  let introSeen = false;
  const filtered = lines.filter((line) => {
    const hasIntro = line.toLowerCase().includes("i'm afaq ahmad");
    if (hasIntro) {
      if (introSeen) return false;
      introSeen = true;
    }
    return true;
  });
  return filtered.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { companyName, jobTitle, jobLink, extraNotes, cvAttachment, matchHighlights, keywords } = body;
    const hrEmailsInput = body.hrEmails || body.hrEmail;

    const hrEmails = Array.isArray(hrEmailsInput)
      ? hrEmailsInput.filter(Boolean).map((e) => String(e).trim())
      : String(hrEmailsInput || '')
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean);

    if (!hrEmails.length) {
      return NextResponse.json({ error: 'HR email is required' }, { status: 400 });
    }

    const { subject, body: generatedBody } = await generateWithAI({
      companyName,
      jobTitle,
      jobLink,
      extraNotes,
      matchHighlights,
      keywords,
    });

    return NextResponse.json({
      subject,
      body: generatedBody,
      hrEmails,
      hrEmail: hrEmails.join(', '),
      companyName,
      jobTitle: jobTitle?.trim() || 'Full Stack Developer',
      cvAttachment: cvAttachment || null,
      matchHighlights: matchHighlights || [],
      keywords: keywords || '',
    });
  } catch (error) {
    console.error('Failed to generate email', error);
    return NextResponse.json({ error: 'Failed to generate email' }, { status: 500 });
  }
}
