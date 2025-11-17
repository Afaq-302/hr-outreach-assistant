import { NextResponse } from 'next/server';

const PROFILE = `You are assisting Afaq Ahmad (MERN/Next.js developer, 4 years experience). Core stack: React, Next.js, Node.js, Express, MongoDB, REST APIs. He has built SaaS dashboards and hiring platforms, and is available immediately for full-time remote, contract, or onsite.`;

export async function POST(req) {
  try {
    const body = await req.json();
    const { jobLink } = body;
    if (!jobLink || !/^https?:\/\//i.test(jobLink)) {
      return NextResponse.json({ error: 'jobLink is required' }, { status: 400 });
    }

    const html = await fetch(jobLink).then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch job link: ${res.status}`);
      return res.text();
    });

    const cleanText = extractText(html).slice(0, 12000);

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(fallbackInsights(jobLink, cleanText));
    }

    const prompt = `${PROFILE}
Given this job description text, extract:
- company name (if present)
- tech stack keywords (comma list)
- responsibilities/requirements, summarized
- 3-5 match highlights tailored to Afaq

Return JSON with keys: companyName, keywords (array), extraNotes, matchHighlights (array). Keep it short.

Job description text:
${cleanText}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 600 },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini error: ${response.status}`);
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = safeJson(raw);
    if (parsed) {
      return NextResponse.json(parsed);
    }
    return NextResponse.json(fallbackInsights(jobLink, cleanText));
  } catch (error) {
    console.error('job-insights failed', error);
    return NextResponse.json(fallbackInsights(''), { status: 200 });
  }
}

function extractText(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeJson(text) {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function fallbackInsights(jobLink, text = '') {
  const hostname = jobLink ? safeHostname(jobLink) : '';
  const keywords = pickKeywords(text);
  const notes = keywords.length ? `Mention experience with ${keywords.slice(0, 3).join(', ')}.` : '';
  return {
    companyName: hostname || '',
    keywords,
    extraNotes: notes,
    matchHighlights: [
      '✔ 4+ years with React/Next.js building production apps',
      '✔ Strong MERN stack experience (MongoDB, Express, React, Node)',
      '✔ Built SaaS dashboards and hiring platforms',
      '✔ Available immediately (remote/contract/onsite)',
    ],
  };
}

function safeHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function pickKeywords(text) {
  const lower = text.toLowerCase();
  const vocab = ['react', 'next', 'node', 'express', 'mongo', 'typescript', 'javascript', 'aws', 'azure', 'gcp', 'graphql', 'rest', 'tailwind', 'redux', 'docker', 'kubernetes', 'ci/cd'];
  const found = vocab.filter((v) => lower.includes(v));
  return Array.from(new Set(found));
}
