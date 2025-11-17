'use client';
import { useEffect, useMemo, useState, useRef } from 'react';
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
    keywords: '',
    matchHighlights: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cvAttachment, setCvAttachment] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const analyzeTimeout = useRef(null);

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
        cvAttachment,
      };
      const response = await fetch('/api/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to generate email');
      const data = await response.json();
      onEmailGenerated({ ...data, cvAttachment });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCvUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    const base64 = dataUrl.split(',')[1] || '';
    const attachment = {
      filename: file.name,
      mime: file.type || 'application/octet-stream',
      content: base64,
    };
    setCvAttachment(attachment);
    try {
      localStorage.setItem('cvAttachment', JSON.stringify(attachment));
    } catch {
      // ignore storage errors
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cvAttachment');
      if (saved) {
        setCvAttachment(JSON.parse(saved));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  useEffect(() => {
    if (analyzeTimeout.current) clearTimeout(analyzeTimeout.current);
    if (!formData.jobLink || !/^https?:\/\//i.test(formData.jobLink)) return;
    analyzeTimeout.current = setTimeout(runAnalysis, 600);
    return () => clearTimeout(analyzeTimeout.current);
  }, [formData.jobLink]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    setAnalysisError('');
    try {
      const response = await fetch('/api/job-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobLink: formData.jobLink }),
      });
      if (!response.ok) throw new Error('Failed to analyze job link');
      const data = await response.json();
      setFormData((prev) => ({
        ...prev,
        companyName: prev.companyName || data.companyName || '',
        keywords: data.keywords?.join(', ') || prev.keywords,
        extraNotes: data.extraNotes || prev.extraNotes,
        matchHighlights: data.matchHighlights || prev.matchHighlights,
      }));
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Job analysis failed');
    } finally {
      setAnalyzing(false);
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
        <p className="text-xs text-muted-foreground mt-1">
          Paste the JD link to auto-fill company, keywords, and match highlights.
          {analyzing && <span className="ml-2 text-emerald-700">Analyzing...</span>}
          {analysisError && <span className="ml-2 text-destructive">{analysisError}</span>}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Extra Notes</label>
        <Textarea name="extraNotes" placeholder="e.g., mention I have 4+ years MERN experience" value={formData.extraNotes} onChange={handleInputChange} rows={3}/>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Keywords</label>
        <Input type="text" name="keywords" placeholder="react, next.js, node, mongo" value={formData.keywords} onChange={handleInputChange}/>
      </div>

      {formData.matchHighlights?.length > 0 && (<div className="border border-border rounded p-3 bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-foreground">Match Highlights</span>
            {analyzing && <span className="text-xs text-emerald-700">Refreshing…</span>}
          </div>
          <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
            {formData.matchHighlights.map((h, idx) => (<li key={`${h}-${idx}`}>{h}</li>))}
          </ul>
        </div>)}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-foreground">Upload CV (defaults to last uploaded)</label>
          {cvAttachment ? <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1">Selected: {cvAttachment.filename}</span> : <span className="text-xs text-muted-foreground">No CV selected</span>}
        </div>
        <Input type="file" accept=".pdf,.doc,.docx" onChange={handleCvUpload}/>
        <p className="text-xs text-muted-foreground">Your most recent uploaded CV will be used by default when sending.</p>
      </div>

      {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>}

      <Button onClick={handleGenerateEmail} disabled={!isFormValid || loading} className="w-full">
        {loading ? 'Generating...' : 'Generate Email'}
      </Button>
    </form>);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
