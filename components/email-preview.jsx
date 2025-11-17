'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const TEMPLATES = {
  standard: (email) => {
    const title = email.jobTitle || 'Full Stack Developer';
    const company = email.companyName ? ` at ${email.companyName}` : '';
    return {
      subject: `Application for ${title}${company}`,
      body: `Dear Hiring Team${company},

I’m Afaq Ahmad, a MERN/Next.js developer with 4 years of experience building reliable, secure, high-performance web apps. I specialize in React, Next.js, Node, Express, MongoDB, and REST APIs and would like to apply for the ${title} role${company}.

I build performant UI, clean APIs, and production-ready features. Recent work includes SaaS dashboards and hiring platforms.

My portfolio: https://afaq-resume.vercel.app/
I’m available immediately (remote/contract/onsite). Please feel free to reach out to discuss fit.

Best regards,
Afaq Ahmad
WhatsApp: +92 312 9113445
Email: ufaq148@gmail.com`,
    };
  },
  short: (email) => {
    const title = email.jobTitle || 'Full Stack Developer';
    const company = email.companyName ? ` at ${email.companyName}` : '';
    return {
      subject: `${title} Application${company}`,
      body: `Hi Team${company},

I’m Afaq Ahmad, MERN/Next.js dev with 4 years’ experience building production apps (React, Next, Node, MongoDB). I’m applying for the ${title} role${company}. Recent work: SaaS dashboards and hiring tools.

Portfolio: https://afaq-resume.vercel.app/
Available immediately. Thanks for your consideration!

Best,
Afaq
WhatsApp: +92 312 9113445
Email: ufaq148@gmail.com`,
    };
  },
  followup: (email) => {
    const title = email.jobTitle || 'Full Stack Developer';
    const company = email.companyName ? ` at ${email.companyName}` : '';
    return {
      subject: `Following up on ${title} application${company}`,
      body: `Hello${company ? ` ${email.companyName} Team` : ' Hiring Team'},

I’m following up on my application for the ${title} role${company}. I have 4 years with MERN/Next.js, shipping performant React/Next apps, APIs, and dashboards. Recent projects include SaaS dashboards and hiring platforms.

Portfolio: https://afaq-resume.vercel.app/
I’m available immediately (remote/contract/onsite) and would welcome the chance to discuss fit.

Best regards,
Afaq Ahmad
WhatsApp: +92 312 9113445
Email: ufaq148@gmail.com`,
    };
  },
};

export default function EmailPreview({ email, onEmailSent, onUpdateEmail }) {
  const [subject, setSubject] = useState(email.subject);
  const [body, setBody] = useState(email.body);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('standard');
  const attachment = email.cvAttachment || null;

  const hrEmails = Array.isArray(email.hrEmails)
    ? email.hrEmails
    : String(email.hrEmail || '')
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);

  const handleSendEmail = async () => {
    setSendError('');
    setSendSuccess(false);
    setSending(true);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: hrEmails,
          subject,
          body,
          attachments: attachment ? [attachment] : [],
        }),
      });
      if (!response.ok) throw new Error('Failed to send email');
      const historyEntry = {
        id: Date.now(),
        hrEmail: hrEmails.join(', '),
        hrEmails,
        companyName: email.companyName,
        jobTitle: email.jobTitle,
        sentAt: new Date().toLocaleString(),
      };
      onEmailSent(historyEntry);
      setSendSuccess(true);
      setTimeout(() => {
        setSendSuccess(false);
      }, 2000);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const applyTemplate = (value) => {
    setSelectedTemplate(value);
    const tmpl = TEMPLATES[value];
    if (!tmpl) return;
    const next = tmpl(email);
    setSubject(next.subject);
    setBody(next.body);
    onUpdateEmail({ ...email, subject: next.subject, body: next.body });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">Email Preview</h3>
        <div className="flex items-start gap-2">
          <span className="text-sm text-muted-foreground mt-1">To:</span>
          <div className="flex flex-wrap gap-2">
            {hrEmails.map((address) => (
              <span
                key={address}
                className="px-2 py-1 text-sm rounded-full border border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm"
              >
                {address}
              </span>
            ))}
          </div>
        </div>
        {attachment && (
          <div className="text-sm text-muted-foreground">
            Attachment: <span className="font-medium text-foreground">{attachment.filename}</span>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Template</label>
        <select
          className="w-full px-3 py-2 border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          value={selectedTemplate}
          onChange={(e) => applyTemplate(e.target.value)}
        >
          <option value="standard">Standard</option>
          <option value="short">Short</option>
          <option value="followup">Follow-up</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            onUpdateEmail({ ...email, subject: e.target.value });
          }}
          className="w-full px-3 py-2 border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Body</label>
        <Textarea
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            onUpdateEmail({ ...email, body: e.target.value });
          }}
          rows={8}
          className="w-full px-3 py-2 border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {sendError && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{sendError}</div>}
      {sendSuccess && <div className="text-sm text-green-700 bg-green-100 p-3 rounded">Email sent!</div>}

      <Button onClick={handleSendEmail} disabled={sending} className="w-full" variant="default">
        {sending ? 'Sending...' : 'Send via my Gmail'}
      </Button>
    </div>
  );
}
