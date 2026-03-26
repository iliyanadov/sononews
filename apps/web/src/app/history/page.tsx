'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PublishedDraft {
  id: string;
  sourcePostId: string;
  sourcePost: {
    id: string;
    text: string;
    postedAt: string;
  };
  headline: string;
  subCaption: string;
  slideCount: number;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface HistoryResponse {
  drafts: PublishedDraft[];
  total: number;
}

export default function HistoryPage() {
  const [drafts, setDrafts] = useState<PublishedDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const response = await fetch('http://localhost:3001/api/drafts');
      if (!response.ok) throw new Error('Failed to fetch history');

      const data: HistoryResponse = await response.json();
      // Filter drafts that have been updated (edited) - these are "published"
      const publishedDrafts = data.drafts.filter(d => d.headline || d.subCaption);
      setDrafts(publishedDrafts);
      setTotal(publishedDrafts.length);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  }

  function getTruncatedText(text: string, maxLength: number = 80): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  }

  function getTimeAgo(dateString: string): string {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Post History</h1>
          <p className="text-muted-foreground">
            Previously created carousel content
          </p>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <Badge variant="secondary">{total} posts</Badge>
          <Button onClick={() => fetchHistory()} variant="outline" size="sm">
            Refresh
          </Button>
        </div>

        {loading && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Loading history...</span>
          </div>
        )}

        {!loading && drafts.length === 0 && (
          <Card>
            <CardContent className="pt-12">
              <div className="text-center text-muted-foreground space-y-4">
                <div className="text-6xl">📜</div>
                <p className="font-medium">No post history yet</p>
                <p className="text-sm">
                  Create and publish drafts to see them here
                </p>
                <Button asChild variant="outline">
                  <a href="/alerts">Go to Alerts</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {drafts.map((draft) => (
            <Card key={draft.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">
                      {draft.headline || 'Untitled Draft'}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {getTruncatedText(draft.subCaption || 'No caption', 100)}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{draft.slideCount} slides</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    <p className="mb-1">Source: {getTruncatedText(draft.sourcePost.text, 80)}</p>
                    <p className="text-xs">
                      Created {getTimeAgo(draft.createdAt)} • Updated {getTimeAgo(draft.updatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild size="sm" variant="default">
                      <Link href={`/drafts/${draft.id}`}>View</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        try {
                          const response = await fetch(`http://localhost:3001/api/export/${draft.id}`);
                          const data = await response.json();
                          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${data.headline.slice(0, 30).replace(/[^a-z0-9]/gi, '_')}_carousel.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                        } catch (error) {
                          console.error('Export failed:', error);
                        }
                      }}
                    >
                      📥 Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
