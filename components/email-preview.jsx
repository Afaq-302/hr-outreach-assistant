'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function EmailPreview({ email, onEmailSent, onUpdateEmail }) {
  const [subject, setSubject] = useState(email.subject);
  const [body, setBody] = useState(email.body);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState(false);

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
