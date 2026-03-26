'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Settings {
  lphThreshold: number;
  pollIntervalMinutes: number;
  monitoringWindowHrs: number;
  brandVoice: string;
  pushNotifications: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    lphThreshold: 500,
    pollIntervalMinutes: 15,
    monitoringWindowHrs: 24,
    brandVoice: '',
    pushNotifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const response = await fetch('http://localhost:3001/api/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');

      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      showNotification('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const response = await fetch('http://localhost:3001/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error('Failed to save settings');

      showNotification('success', 'Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showNotification('error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  function showNotification(type: 'success' | 'error', message: string) {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Loading settings...</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="container mx-auto max-w-3xl">
        {/* Notification */}
        {notification && (
          <div className={`mb-4 p-4 rounded-lg ${
            notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {notification.message}
          </div>
        )}

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure your KurrAlert preferences
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/alerts">← Back to Alerts</Link>
          </Button>
        </div>

        <div className="space-y-6">
          {/* Virality Detection */}
          <Card>
            <CardHeader>
              <CardTitle>Virality Detection</CardTitle>
              <CardDescription>
                Configure how viral content is detected
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  LPH Alert Threshold
                </label>
                <Input
                  type="number"
                  value={settings.lphThreshold}
                  onChange={(e) => setSettings({ ...settings, lphThreshold: parseFloat(e.target.value) || 0 })}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum likes-per-hour to trigger an alert
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Polling Interval (minutes)
                </label>
                <Input
                  type="number"
                  value={settings.pollIntervalMinutes}
                  onChange={(e) => setSettings({ ...settings, pollIntervalMinutes: parseInt(e.target.value) || 15 })}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  How often to check for new posts (recommended: 5-15 minutes)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Monitoring Window (hours)
                </label>
                <Input
                  type="number"
                  value={settings.monitoringWindowHrs}
                  onChange={(e) => setSettings({ ...settings, monitoringWindowHrs: parseInt(e.target.value) || 24 })}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  How long to track each post for virality (default: 24 hours)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI & Content */}
          <Card>
            <CardHeader>
              <CardTitle>AI Content Generation</CardTitle>
              <CardDescription>
                Customize how AI generates your carousel content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Brand Voice / Tone Guide
                </label>
                <Textarea
                  value={settings.brandVoice}
                  onChange={(e) => setSettings({ ...settings, brandVoice: e.target.value })}
                  placeholder="e.g., Energetic, hip-hop focused, uses emojis, speaks to younger audience..."
                  rows={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Describe your desired tone and style. This will be used to guide AI-generated content.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Manage how you receive alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium">
                    Push Notifications
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Receive browser notifications when viral content is detected
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={fetchSettings}>
              Reset
            </Button>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
