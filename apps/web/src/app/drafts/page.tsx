'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SourcePost {
  id: string;
  text: string;
  postedAt: string;
  currentLph: number;
}

interface Draft {
  id: string;
  sourcePostId: string;
  sourcePost: SourcePost;
  headline: string;
  subCaption: string;
  slideCount: number;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DraftsResponse {
  drafts: Draft[];
  total: number;
  limit: number;
  offset: number;
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchDrafts();
  }, []);

  async function fetchDrafts() {
    try {
      const response = await fetch('http://localhost:3001/api/drafts');
      if (!response.ok) throw new Error('Failed to fetch drafts');

      const data: DraftsResponse = await response.json();
      setDrafts(data.drafts);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch drafts:', error);
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
          <h1 className="text-4xl font-bold mb-2">Drafts</h1>
          <p className="text-muted-foreground">
            AI-generated carousel content ready for editing
          </p>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Badge variant="secondary">{total} drafts</Badge>
          </div>
          <Button onClick={() => fetchDrafts()} variant="outline" size="sm">
            Refresh
          </Button>
        </div>

        {loading && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Loading drafts...</span>
          </div>
        )}

        {!loading && drafts.length === 0 && (
          <Card>
            <CardContent className="pt-12">
              <div className="text-center text-muted-foreground space-y-4">
                <div className="text-6xl">📝</div>
                <p className="font-medium">No drafts yet</p>
                <p className="text-sm">
                  Create drafts from alerts to get started with AI-generated content
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
                      <Link href={`/drafts/${draft.id}`}>Edit Draft</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        try {
                          await fetch(`http://localhost:3001/api/drafts/${draft.id}`, {
                            method: 'DELETE',
                          });
                          await fetchDrafts();
                        } catch (error) {
                          console.error('Failed to delete draft:', error);
                        }
                      }}
                    >
                      Delete
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
