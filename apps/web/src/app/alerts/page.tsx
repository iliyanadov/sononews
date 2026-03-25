'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AlertPost {
  id: string;
  text: string;
  mediaUrls: string[];
  postedAt: string;
  likeCount: number;
  currentLph: number;
  status: string;
  alertFired: boolean;
}

interface AlertsResponse {
  alerts: AlertPost[];
  total: number;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDismissed, setShowDismissed] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, [showDismissed]);

  async function fetchAlerts() {
    try {
      const url = showDismissed
        ? 'http://localhost:3001/api/alerts?includeDismissed=true'
        : 'http://localhost:3001/api/alerts';

      const response = await fetch(url);
      const data: AlertsResponse = await response.json();
      setAlerts(data.alerts);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function dismissAlert(id: string) {
    try {
      await fetch(`http://localhost:3001/api/alerts/${id}/dismiss`, {
        method: 'POST',
      });
      await fetchAlerts();
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  }

  async function createDraft(id: string) {
    try {
      const response = await fetch(`http://localhost:3001/api/alerts/${id}/create-draft`, {
        method: 'POST',
      });
      const data = await response.json();
      console.log('Draft created:', data.draftId);
      // TODO: Navigate to editor
    } catch (error) {
      console.error('Failed to create draft:', error);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
        <div className="container mx-auto">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Loading alerts...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Alert Dashboard</h1>
          <p className="text-muted-foreground">
            Viral hip-hop news from @{process.env.NEXT_PUBLIC_TWITTER_ACCOUNT || 'ComplexMusic'}
          </p>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showDismissed}
                onChange={(e) => setShowDismissed(e.target.checked)}
                className="rounded"
              />
              <span>Show dismissed alerts</span>
            </label>
          </div>
          <Badge variant="secondary">{alerts.length} alerts</Badge>
        </div>

        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className={alert.status === 'DISMISSED' ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge
                        variant={alert.currentLph >= 500 ? 'destructive' : 'secondary'}
                      >
                        {alert.currentLph.toFixed(0)} LPH
                      </Badge>
                      <Badge variant="outline">{getTimeAgo(alert.postedAt)}</Badge>
                    </div>
                    <CardDescription className="text-sm">
                      ❤️ {alert.likeCount.toLocaleString()} likes • 📊 {alert.currentLph.toFixed(1)} likes/hour
                    </CardDescription>
                  </div>
                  {alert.mediaUrls.length > 0 && (
                    <div className="h-12 w-12 bg-muted rounded flex items-center justify-center text-xs">
                      📷
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4 line-clamp-3">{alert.text}</p>
                <div className="flex items-center space-x-2">
                  {alert.status !== 'DISMISSED' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => dismissAlert(alert.id)}
                      >
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => createDraft(alert.id)}
                      >
                        Create Post
                      </Button>
                    </>
                  )}
                  {alert.status === 'DISMISSED' && (
                    <span className="text-xs text-muted-foreground">Dismissed</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {alerts.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <p>No alerts yet. The scraper is monitoring for viral content...</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
