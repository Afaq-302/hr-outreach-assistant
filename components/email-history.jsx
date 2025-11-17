'use client';
import { Button } from '@/components/ui/button';
export default function EmailHistory({ history, onClearHistory }) {
  return (<div className="space-y-3 max-h-96 overflow-y-auto">
    {history.length === 0 ? (<p className="text-sm text-muted-foreground">No emails sent yet</p>) : (<>
      <ul className="space-y-2">
        {history.map((entry, id) => (<li key={id} className="text-sm bg-background p-3 rounded border border-border">
          <div className="font-medium text-foreground">{entry.companyName}</div>
          <div className="text-xs text-muted-foreground">{entry.hrEmail}</div>
          {entry.jobTitle && <div className="text-xs text-muted-foreground">{entry.jobTitle}</div>}
          <div className="text-xs text-muted-foreground mt-1">{entry.sentAt}</div>
        </li>))}
      </ul>
      <Button onClick={onClearHistory} variant="outline" size="sm" className="w-full">
        Clear History
      </Button>
    </>)}
  </div>);
}
