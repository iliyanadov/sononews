'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getNotificationPermission, requestNotificationPermission } from '@/lib/push';

export function NotificationPermissionBanner() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setPermission(getNotificationPermission());

    // Check if user previously dismissed
    const wasDismissed = localStorage.getItem('notification-banner-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  async function handleEnable() {
    const granted = await requestNotificationPermission();
    setPermission(granted ? 'granted' : 'denied');

    if (granted) {
      showTestNotification();
    }
  }

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem('notification-banner-dismissed', 'true');
  }

  function showTestNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🔔 KurrAlert Notifications Enabled', {
        body: 'You\'ll receive alerts when viral content is detected!',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
      });
    }
  }

  if (dismissed || permission === 'granted' || permission === 'denied') {
    return null;
  }

  return (
    <Card className="mb-4 border-blue-500 bg-blue-50 dark:bg-blue-950">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div>
              <p className="font-medium text-sm">Enable Notifications</p>
              <p className="text-xs text-muted-foreground">
                Get notified instantly when viral content is detected
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleEnable}>
              Enable
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              Dismiss
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
