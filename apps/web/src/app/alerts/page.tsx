'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NotificationPermissionBanner } from '@/components/NotificationPermissionBanner';
import { showNotification } from '@/lib/push';

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
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [dismissing, setDismissing] = useState<Record<string, boolean>>({});
  const [creatingDraft, setCreatingDraft] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [previousAlertCount, setPreviousAlertCount] = useState(0);

  useEffect(() => {
    fetchAlerts();
  }, [showDismissed]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAlerts();
      setLastRefresh(new Date());
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, showDismissed]);

  async function fetchAlerts() {
    try {
      const url = showDismissed
        ? 'http://localhost:3001/api/alerts?includeDismissed=true'
        : 'http://localhost:3001/api/alerts';

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch alerts');

      const data: AlertsResponse = await response.json();

      // Check for new alerts and notify
      if (data.alerts.length > previousAlertCount && previousAlertCount > 0) {
        const newAlertsCount = data.alerts.length - previousAlertCount;
        showNotification(
          `🚨 ${newAlertsCount} new viral ${newAlertsCount === 1 ? 'post' : 'posts'} detected!`,
          { body: `LPH: ${data.alerts[0].currentLph.toFixed(0)} • ${data.alerts[0].text.slice(0, 100)}...` }
        );
      }

      setAlerts(data.alerts);
      setPreviousAlertCount(data.alerts.length);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function dismissAlert(id: string) {
    setDismissing({ ...dismissing, [id]: true });
    try {
      await fetch(`http://localhost:3001/api/alerts/${id}/dismiss`, {
        method: 'POST',
      });
      setNotification({ type: 'success', message: 'Alert dismissed' });
      await fetchAlerts();
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
      setNotification({ type: 'error', message: 'Failed to dismiss alert' });
      setDismissing({ ...dismissing, [id]: false });
    }
  }

  async function createDraft(id: string) {
    setCreatingDraft({ ...creatingDraft, [id]: true });
    try {
      const response = await fetch(`http://localhost:3001/api/alerts/${id}/create-draft`, {
        method: 'POST',
      });
      const data = await response.json();
      setNotification({ type: 'success', message: 'Draft created! Redirecting...' });

      // Navigate to draft editor after a short delay
      setTimeout(() => {
        window.location.href = `/drafts/${data.draftId}`;
      }, 1000);
    } catch (error) {
      console.error('Failed to create draft:', error);
      setNotification({ type: 'error', message: 'Failed to create draft' });
    } finally {
      setCreatingDraft({ ...creatingDraft, [id]: false });
    }
  }

  async function copyTweetText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotification({ type: 'success', message: 'Copied to clipboard!' });
    } catch (error) {
      console.error('Failed to copy:', error);
      setNotification({ type: 'error', message: 'Failed to copy' });
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

  function getLPHVariant(lph: number): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (lph >= 5000) return 'destructive';
    if (lph >= 2000) return 'default';
    if (lph >= 1000) return 'secondary';
    return 'outline';
  }

  function getLPHColor(lph: number): string {
    if (lph >= 5000) return 'bg-red-500 hover:bg-red-600 text-white';
    if (lph >= 2000) return 'bg-orange-500 hover:bg-orange-600 text-white';
    if (lph >= 1000) return 'bg-yellow-500 hover:bg-yellow-600 text-black';
    return 'bg-slate-500 hover:bg-slate-600 text-white';
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

        <NotificationPermissionBanner />

        {notification && (
          <div className={`mb-4 p-4 rounded-lg ${
            notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {notification.message}
          </div>
        )}

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
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span>Auto-refresh (30s)</span>
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Button asChild variant="ghost" size="sm">
              <a href="/settings">⚙️ Settings</a>
            </Button>
            <Badge variant="secondary">{alerts.length} alerts</Badge>
            <span className="text-xs text-muted-foreground">
              Last refresh: {lastRefresh.toLocaleTimeString()}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className={alert.status === 'DISMISSED' ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge
                        variant={getLPHVariant(alert.currentLph)}
                        className={getLPHColor(alert.currentLph)}
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
                {alert.mediaUrls.length > 0 && (
                  <div className="mb-4 flex gap-2">
                    {alert.mediaUrls.slice(0, 3).map((url, idx) => (
                      <div key={idx} className="relative w-20 h-20 bg-muted rounded overflow-hidden">
                        <img
                          src={url}
                          alt={`Media ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/80';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-sm mb-4 line-clamp-3">{alert.text}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyTweetText(alert.text)}
                    title="Copy tweet text"
                  >
                    📋 Copy
                  </Button>
                  {alert.status !== 'DISMISSED' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => dismissAlert(alert.id)}
                        disabled={dismissing[alert.id]}
                      >
                        {dismissing[alert.id] ? 'Dismissing...' : 'Dismiss'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => createDraft(alert.id)}
                        disabled={creatingDraft[alert.id]}
                      >
                        {creatingDraft[alert.id] ? 'Creating...' : 'Create Post'}
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
            <CardContent className="pt-12">
              <div className="text-center text-muted-foreground space-y-4">
                <div className="text-6xl">📭</div>
                <p className="font-medium">No alerts yet</p>
                <p className="text-sm">
                  {showDismissed
                    ? 'No dismissed alerts to show'
                    : 'The scraper is monitoring for viral content...'}
                </p>
                {!loading && (
                  <Button onClick={() => fetchAlerts()} variant="outline" size="sm">
                    Check Now
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
