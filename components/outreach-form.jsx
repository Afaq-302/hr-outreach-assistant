'use client';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function OutreachForm({ onEmailGenerated, onEmailSent }) {
  const [formData, setFormData] = useState({
    hrEmailsInput: '',
    companyName: '',
    jobTitle: '',
    jobLink: '',
    extraNotes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hrEmails = useMemo(() => formData.hrEmailsInput.split(',').map((e) => e.trim()).filter(Boolean), [formData.hrEmailsInput]);
  const invalidEmails = hrEmails.filter((e) => !emailRegex.test(e));
  const isFormValid = hrEmails.length > 0 && invalidEmails.length === 0;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateEmail = async () => {
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...formData,
        hrEmails,
      };
      const response = await fetch('/api/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to generate email');
      const data = await response.json();
      onEmailGenerated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (<form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">HR Email(s) *</label>
        <Input type="text" name="hrEmailsInput" placeholder="recruiter@company.com, techlead@company.com" value={formData.hrEmailsInput} onChange={handleInputChange} className={`transition focus:outline-none ${invalidEmails.length === 0 && hrEmails.length ? 'border-emerald-500 ring-1 ring-emerald-500/50 hover:ring-emerald-300/70' : ''} ${invalidEmails.length ? 'border-red-500 ring-1 ring-red-500/50 hover:ring-red-300/70' : ''}`}/>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Company Name (optional)</label>
        <Input type="text" name="companyName" placeholder="e.g., Vercel" value={formData.companyName} onChange={handleInputChange}/>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Job Title</label>
        <Input type="text" name="jobTitle" placeholder="e.g., Senior React Developer" value={formData.jobTitle} onChange={handleInputChange}/>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Job Link</label>
        <Input type="url" name="jobLink" placeholder="https://..." value={formData.jobLink} onChange={handleInputChange}/>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Extra Notes</label>
        <Textarea name="extraNotes" placeholder="e.g., mention I have 4+ years MERN experience" value={formData.extraNotes} onChange={handleInputChange} rows={3}/>
      </div>

      {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>}

      <Button onClick={handleGenerateEmail} disabled={!isFormValid || loading} className="w-full">
        {loading ? 'Generating...' : 'Generate Email'}
      </Button>
    </form>);
}
