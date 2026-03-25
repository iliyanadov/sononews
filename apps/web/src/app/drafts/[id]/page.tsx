'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface SourcePost {
  id: string;
  text: string;
  mediaUrls: string[];
  postedAt: string;
}

interface Slide {
  id: string;
  position: number;
  copy: string;
  isAiGenerated: boolean;
}

interface Draft {
  id: string;
  sourcePostId: string;
  sourcePost: SourcePost;
  headline: string;
  subCaption: string;
  thumbnailUrl: string | null;
  slides: Slide[];
  createdAt: string;
  updatedAt: string;
}

export default function DraftEditorPage() {
  const params = useParams();
  const id = params.id as string;

  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingHeadline, setEditingHeadline] = useState(false);
  const [editingCaption, setEditingCaption] = useState(false);
  const [headlineInput, setHeadlineInput] = useState('');
  const [captionInput, setCaptionInput] = useState('');
  const [editingSlide, setEditingSlide] = useState<string | null>(null);
  const [slideCopy, setSlideCopy] = useState('');
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    if (id) fetchDraft();
  }, [id]);

  async function fetchDraft() {
    try {
      const response = await fetch(`http://localhost:3001/api/drafts/${id}`);
      if (!response.ok) throw new Error('Failed to fetch draft');

      const data: Draft = await response.json();
      setDraft(data);
      setHeadlineInput(data.headline);
      setCaptionInput(data.subCaption);
    } catch (error) {
      console.error('Failed to fetch draft:', error);
      showNotification('error', 'Failed to load draft');
    } finally {
      setLoading(false);
    }
  }

  async function saveHeadline() {
    if (!draft) return;
    setSaving(true);
    try {
      const response = await fetch(`http://localhost:3001/api/drafts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline: headlineInput }),
      });
      if (!response.ok) throw new Error('Failed to update headline');

      setDraft({ ...draft, headline: headlineInput });
      setEditingHeadline(false);
      showNotification('success', 'Headline updated');
    } catch (error) {
      console.error('Failed to save headline:', error);
      showNotification('error', 'Failed to save headline');
    } finally {
      setSaving(false);
    }
  }

  async function saveCaption() {
    if (!draft) return;
    setSaving(true);
    try {
      const response = await fetch(`http://localhost:3001/api/drafts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subCaption: captionInput }),
      });
      if (!response.ok) throw new Error('Failed to update caption');

      setDraft({ ...draft, subCaption: captionInput });
      setEditingCaption(false);
      showNotification('success', 'Caption updated');
    } catch (error) {
      console.error('Failed to save caption:', error);
      showNotification('error', 'Failed to save caption');
    } finally {
      setSaving(false);
    }
  }

  async function regenerateHeadline() {
    if (!draft) return;
    setSaving(true);
    try {
      const response = await fetch(`http://localhost:3001/api/drafts/${id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'headline' }),
      });
      if (!response.ok) throw new Error('Failed to regenerate headline');

      const data = await response.json();
      setDraft({ ...draft, headline: data.selected });
      setHeadlineInput(data.selected);
      showNotification('success', 'Headline regenerated');
    } catch (error) {
      console.error('Failed to regenerate headline:', error);
      showNotification('error', 'Failed to regenerate headline');
    } finally {
      setSaving(false);
    }
  }

  async function regenerateCaption() {
    if (!draft) return;
    setSaving(true);
    try {
      const response = await fetch(`http://localhost:3001/api/drafts/${id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'subCaption' }),
      });
      if (!response.ok) throw new Error('Failed to regenerate caption');

      const data = await response.json();
      setDraft({ ...draft, subCaption: data.selected });
      setCaptionInput(data.selected);
      showNotification('success', 'Caption regenerated');
    } catch (error) {
      console.error('Failed to regenerate caption:', error);
      showNotification('error', 'Failed to regenerate caption');
    } finally {
      setSaving(false);
    }
  }

  async function regenerateAllSlides() {
    if (!draft) return;
    setSaving(true);
    try {
      const response = await fetch(`http://localhost:3001/api/drafts/${id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'slides' }),
      });
      if (!response.ok) throw new Error('Failed to regenerate slides');

      await fetchDraft();
      showNotification('success', 'All slides regenerated');
    } catch (error) {
      console.error('Failed to regenerate slides:', error);
      showNotification('error', 'Failed to regenerate slides');
    } finally {
      setSaving(false);
    }
  }

  async function saveSlide(slideId: string, copy: string) {
    setSaving(true);
    try {
      const slide = draft?.slides.find(s => s.id === slideId);
      if (!slide) return;

      const response = await fetch(
        `http://localhost:3001/api/drafts/${id}/slides/${slide.position}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ copy }),
        }
      );
      if (!response.ok) throw new Error('Failed to update slide');

      setDraft({
        ...draft!,
        slides: draft!.slides.map(s =>
          s.id === slideId ? { ...s, copy, isAiGenerated: false } : s
        ),
      });
      setEditingSlide(null);
      showNotification('success', 'Slide updated');
    } catch (error) {
      console.error('Failed to save slide:', error);
      showNotification('error', 'Failed to save slide');
    } finally {
      setSaving(false);
    }
  }

  async function repromptSlide(slideId: string) {
    setSaving(true);
    try {
      const slide = draft?.slides.find(s => s.id === slideId);
      if (!slide) return;

      const response = await fetch(
        `http://localhost:3001/api/drafts/${id}/slides/${slide.position}/reprompt`,
        { method: 'POST' }
      );
      if (!response.ok) throw new Error('Failed to reprompt slide');

      const data = await response.json();
      setDraft({
        ...draft!,
        slides: draft!.slides.map(s =>
          s.id === slideId ? { ...s, copy: data.copy, isAiGenerated: false } : s
        ),
      });
      showNotification('success', 'Slide regenerated');
    } catch (error) {
      console.error('Failed to reprompt slide:', error);
      showNotification('error', 'Failed to regenerate slide');
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
        <div className="container mx-auto">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Loading draft...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
        <div className="container mx-auto">
          <Card>
            <CardContent className="pt-12">
              <div className="text-center text-muted-foreground space-y-4">
                <div className="text-6xl">❌</div>
                <p className="font-medium">Draft not found</p>
                <Button asChild variant="outline">
                  <Link href="/drafts">Back to Drafts</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="container mx-auto max-w-5xl">
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
            <h1 className="text-3xl font-bold">Edit Draft</h1>
            <p className="text-sm text-muted-foreground">
              Created {new Date(draft.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/drafts">← Back</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/alerts">View Alerts</Link>
            </Button>
          </div>
        </div>

        {/* Source Post */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Source Tweet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{draft.sourcePost.text}</p>
          </CardContent>
        </Card>

        {/* Headline */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Headline</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={regenerateHeadline}
                disabled={saving}
              >
                {saving ? 'Regenerating...' : '🔄 Regenerate'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {editingHeadline ? (
              <div className="space-y-2">
                <Input
                  value={headlineInput}
                  onChange={(e) => setHeadlineInput(e.target.value)}
                  placeholder="Enter headline..."
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveHeadline} disabled={saving}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingHeadline(false);
                      setHeadlineInput(draft.headline);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="p-3 bg-muted rounded cursor-pointer hover:bg-muted/80"
                onClick={() => setEditingHeadline(true)}
              >
                {draft.headline || 'Click to add headline...'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sub Caption */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Sub Caption</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={regenerateCaption}
                disabled={saving}
              >
                {saving ? 'Regenerating...' : '🔄 Regenerate'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {editingCaption ? (
              <div className="space-y-2">
                <Textarea
                  value={captionInput}
                  onChange={(e) => setCaptionInput(e.target.value)}
                  placeholder="Enter caption..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveCaption} disabled={saving}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingCaption(false);
                      setCaptionInput(draft.subCaption);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="p-3 bg-muted rounded cursor-pointer hover:bg-muted/80"
                onClick={() => setEditingCaption(true)}
              >
                {draft.subCaption || 'Click to add caption...'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Slides */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Slides ({draft.slides.length})</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={regenerateAllSlides}
                disabled={saving}
              >
                {saving ? 'Regenerating...' : '🔄 Regenerate All'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {draft.slides
                .sort((a, b) => a.position - b.position)
                .map((slide) => (
                  <div key={slide.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">Slide {slide.position}</Badge>
                      {slide.isAiGenerated && (
                        <Badge variant="secondary" className="text-xs">AI Generated</Badge>
                      )}
                    </div>
                    {editingSlide === slide.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={slideCopy}
                          onChange={(e) => setSlideCopy(e.target.value)}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => saveSlide(slide.id, slideCopy)}
                            disabled={saving}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingSlide(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm">{slide.copy}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingSlide(slide.id);
                              setSlideCopy(slide.copy);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => repromptSlide(slide.id)}
                            disabled={saving}
                          >
                            {saving ? 'Regenerating...' : '🔄 Reprompt'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
