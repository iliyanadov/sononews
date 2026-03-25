'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchHealth, HealthResponse } from '@/lib/api';

export default function HomePage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth()
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              SonoNews
            </h1>
            <p className="text-xl text-muted-foreground">
              KurrAlert — Hip-Hop News Monitor & Content Generator
            </p>
            <Badge variant="secondary" className="text-sm">
              Powered by Claude AI
            </Badge>
          </div>

          {/* API Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>
                API connectivity and service health
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm text-muted-foreground">Checking API status...</span>
                </div>
              )}

              {error && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      API Disconnected
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              )}

              {health && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      API Connected
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Service:</span>
                      <span className="ml-2 font-medium">{health.service}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Version:</span>
                      <span className="ml-2 font-medium">{health.version}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Last Check:</span>
                      <span className="ml-2 font-medium">{new Date(health.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild variant="default" className="flex-1">
                  <a href="/alerts">View Alerts</a>
                </Button>
                <Button asChild variant="outline" className="flex-1" disabled>
                  <a href="#">Editor (Coming Soon)</a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monitor @Kurrco</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Automatically tracks X/Twitter posts and detects viral content using LPH (likes-per-hour) scoring.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Content Generation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Uses Claude AI to generate headlines, captions, and slide content for Instagram carousels.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Visual Editor</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Edit and refine generated content with an intuitive visual editor before exporting.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Coming Soon */}
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">More features coming soon</p>
                <p className="text-xs text-muted-foreground">
                  Alert dashboard • Content editor • Image search • Export functionality
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
