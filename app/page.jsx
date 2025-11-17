'use client';
import { useState, useEffect } from 'react';
import OutreachForm from '@/components/outreach-form';
import EmailPreview from '@/components/email-preview';
import EmailHistory from '@/components/email-history';
export default function Home() {
    const [generatedEmail, setGeneratedEmail] = useState(null);
    const [history, setHistory] = useState([]);
    // Load history from localStorage on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem('emailHistory');
        if (savedHistory) {
            try {
                setHistory(JSON.parse(savedHistory));
            }
            catch (error) {
                console.error('Failed to load history:', error);
            }
        }
    }, []);
    // Save history to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('emailHistory', JSON.stringify(history));
    }, [history]);
    const handleEmailGenerated = (email) => {
        setGeneratedEmail(email);
    };
    const handleEmailSent = (entry) => {
        setHistory([entry, ...history]);
    };
    const handleClearHistory = () => {
        setHistory([]);
    };
    return (<div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-foreground">HR Outreach Assistant</h1>
          <p className="text-muted-foreground mt-2">Generate and send personalized job emails via Gmail</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form & Preview Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-6">Email Details</h2>
              <OutreachForm onEmailGenerated={handleEmailGenerated} onEmailSent={handleEmailSent}/>
            </div>

            {generatedEmail && (<EmailPreview email={generatedEmail} onEmailSent={handleEmailSent} onUpdateEmail={setGeneratedEmail}/>)}
          </div>

          {/* History Section */}
          <div className="bg-card border border-border rounded-lg p-6 h-fit">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Recent Sent Emails</h2>
            <EmailHistory history={history} onClearHistory={handleClearHistory}/>
          </div>
        </div>
      </main>
    </div>);
}
