'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageSearch } from '@/components/ImageSearch';
import { SlidePreview, ExtensionSlidePreview } from '@/components/SlidePreview';
import { createHistory } from '@/lib/undo';

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
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [history, setHistory] = useState<Draft[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showPreview, setShowPreview] = useState(false);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, historyIndex]);

  function canUndo() {
    return historyIndex > 0;
  }

  function canRedo() {
    return historyIndex < history.length - 1;
  }

  function undo() {
    if (!canUndo()) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setDraft(history[newIndex]);
    setHeadlineInput(history[newIndex].headline);
    setCaptionInput(history[newIndex].subCaption);
    showNotification('success', 'Undo');
  }

  function redo() {
    if (!canRedo()) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setDraft(history[newIndex]);
    setHeadlineInput(history[newIndex].headline);
    setCaptionInput(history[newIndex].subCaption);
    showNotification('success', 'Redo');
  }

  function saveToHistory(newDraft: Draft) {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newDraft);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    // Limit history to 50 entries
    if (newHistory.length > 50) {
      setHistory(newHistory.slice(-50));
      setHistoryIndex(49);
    }
  }

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
      setHistory([data]);
      setHistoryIndex(0);
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

      const updatedDraft = { ...draft, headline: headlineInput };
      setDraft(updatedDraft);
      saveToHistory(updatedDraft);
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

      const updatedDraft = { ...draft, subCaption: captionInput };
      setDraft(updatedDraft);
      saveToHistory(updatedDraft);
      setEditingCaption(false);
      showNotification('success', 'Caption updated');
    } catch (error) {
      console.error('Failed to save caption:', error);
      showNotification('error', 'Failed to save caption');
    } finally {
      setSaving(false);
    }
  }

  async function handleImageSelect(imageUrl: string) {
    if (!draft) return;
    setSaving(true);
    try {
      const response = await fetch(`http://localhost:3001/api/drafts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thumbnailUrl: imageUrl }),
      });
      if (!response.ok) throw new Error('Failed to update thumbnail');

      const updatedDraft = { ...draft, thumbnailUrl: imageUrl };
      setDraft(updatedDraft);
      saveToHistory(updatedDraft);
      setShowImageSearch(false);
      showNotification('success', 'Thumbnail updated');
    } catch (error) {
      console.error('Failed to save thumbnail:', error);
      showNotification('error', 'Failed to save thumbnail');
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
      const updatedDraft = { ...draft, headline: data.selected };
      setDraft(updatedDraft);
      saveToHistory(updatedDraft);
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
      const updatedDraft = { ...draft, subCaption: data.selected };
      setDraft(updatedDraft);
      saveToHistory(updatedDraft);
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

      const updatedDraft = {
        ...draft!,
        slides: draft!.slides.map(s =>
          s.id === slideId ? { ...s, copy, isAiGenerated: false } : s
        ),
      };
      setDraft(updatedDraft);
      saveToHistory(updatedDraft);
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

  async function addSlide() {
    setSaving(true);
    try {
      const response = await fetch(`http://localhost:3001/api/drafts/${id}/slides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ copy: '' }),
      });
      if (!response.ok) throw new Error('Failed to add slide');

      await fetchDraft();
      showNotification('success', 'Slide added');
    } catch (error) {
      console.error('Failed to add slide:', error);
      showNotification('error', 'Failed to add slide');
    } finally {
      setSaving(false);
    }
  }

  async function removeSlide(slideId: string, position: number) {
    setSaving(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/drafts/${id}/slides/${position}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Failed to remove slide');

      await fetchDraft();
      showNotification('success', 'Slide removed');
    } catch (error) {
      console.error('Failed to remove slide:', error);
      showNotification('error', 'Failed to remove slide');
    } finally {
      setSaving(false);
    }
  }

  async function moveSlideUp(slideId: string, position: number) {
    if (position <= 2) return; // Can't move cover slide or slide 2 above position 1
    setSaving(true);
    try {
      const slides = draft?.slides || [];
      const currentIndex = slides.findIndex(s => s.id === slideId);
      if (currentIndex <= 0) return;

      const newOrder = [...slides];
      [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];

      const response = await fetch(`http://localhost:3001/api/drafts/${id}/slides/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slideIds: newOrder.map(s => s.id) }),
      });
      if (!response.ok) throw new Error('Failed to reorder slides');

      await fetchDraft();
      showNotification('success', 'Slide moved up');
    } catch (error) {
      console.error('Failed to move slide:', error);
      showNotification('error', 'Failed to move slide');
    } finally {
      setSaving(false);
    }
  }

  async function moveSlideDown(slideId: string, position: number) {
    if (position === 1) return; // Can't move cover slide
    setSaving(true);
    try {
      const slides = draft?.slides || [];
      const currentIndex = slides.findIndex(s => s.id === slideId);
      if (currentIndex === -1 || currentIndex >= slides.length - 1) return;

      const newOrder = [...slides];
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];

      const response = await fetch(`http://localhost:3001/api/drafts/${id}/slides/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slideIds: newOrder.map(s => s.id) }),
      });
      if (!response.ok) throw new Error('Failed to reorder slides');

      await fetchDraft();
      showNotification('success', 'Slide moved down');
    } catch (error) {
      console.error('Failed to move slide:', error);
      showNotification('error', 'Failed to move slide');
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
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={!canUndo() || saving}
              title="Undo (Ctrl+Z)"
            >
              ↶ Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={!canRedo() || saving}
              title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
            >
              ↷ Redo
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/drafts">← Back</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const response = await fetch(`http://localhost:3001/api/export/${id}`);
                  const data = await response.json();
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${data.headline.slice(0, 30).replace(/[^a-z0-9]/gi, '_')}_carousel.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  showNotification('success', 'Draft exported!');
                } catch (error) {
                  console.error('Export failed:', error);
                  showNotification('error', 'Failed to export draft');
                }
              }}
            >
              📥 Export JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? '📝 Edit' : '👁️ Preview'}
            </Button>
          </div>
        </div>

        {/* Preview Mode */}
        {showPreview ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Slide Preview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SlidePreview
                  headline={draft.headline}
                  subCaption={draft.subCaption}
                  thumbnailUrl={draft.thumbnailUrl}
                  slideNumber={1}
                />
                {draft.slides
                  .filter(s => s.position > 1)
                  .sort((a, b) => a.position - b.position)
                  .map((slide) => (
                    <ExtensionSlidePreview
                      key={slide.id}
                      slideNumber={slide.position}
                      copy={slide.copy}
                    />
                  ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHeadlineInput(e.target.value)}
                  placeholder="Enter headline..."
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {headlineInput.length} chars
                  </span>
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
              </div>
            ) : (
              <div
                className="p-3 bg-muted rounded cursor-pointer hover:bg-muted/80"
                onClick={() => setEditingHeadline(true)}
              >
                {draft.headline || 'Click to add headline...'}
                <span className="text-xs text-muted-foreground ml-2">
                  ({draft.headline.length} chars)
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Thumbnail */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Cover Image</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowImageSearch(true)}
              >
                Search Images
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {draft.thumbnailUrl ? (
              <div className="space-y-2">
                <img
                  src={draft.thumbnailUrl}
                  alt="Draft thumbnail"
                  className="w-full h-48 object-cover rounded"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    await handleImageSelect('');
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div
                className="p-12 bg-muted rounded text-center text-muted-foreground cursor-pointer hover:bg-muted/80"
                onClick={() => setShowImageSearch(true)}
              >
                <div className="text-4xl mb-2">🖼️</div>
                <p>Click to add a cover image</p>
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
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCaptionInput(e.target.value)}
                  placeholder="Enter caption..."
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {captionInput.length} chars • {captionInput.split(/\s+/).filter(w => w).length} words
                  </span>
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
              </div>
            ) : (
              <div
                className="p-3 bg-muted rounded cursor-pointer hover:bg-muted/80"
                onClick={() => setEditingCaption(true)}
              >
                {draft.subCaption || 'Click to add caption...'}
                <span className="text-xs text-muted-foreground ml-2">
                  ({draft.subCaption.length} chars)
                </span>
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
                  <div key={slide.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Slide {slide.position}</Badge>
                        {slide.isAiGenerated && (
                          <Badge variant="secondary" className="text-xs">AI Generated</Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {slide.position > 2 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => moveSlideUp(slide.id, slide.position)}
                            disabled={saving}
                            title="Move up"
                          >
                            ↑
                          </Button>
                        )}
                        {slide.position > 1 && slide.position < draft.slides.length && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => moveSlideDown(slide.id, slide.position)}
                            disabled={saving}
                            title="Move down"
                          >
                            ↓
                          </Button>
                        )}
                        {slide.position > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => removeSlide(slide.id, slide.position)}
                            disabled={saving}
                            title="Remove slide"
                          >
                            🗑️
                          </Button>
                        )}
                      </div>
                    </div>

                    {editingSlide === slide.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={slideCopy}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSlideCopy(e.target.value)}
                          rows={3}
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {slideCopy.length} chars • {slideCopy.split(/\s+/).filter(w => w).length} words
                          </span>
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
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm">{slide.copy || <span className="text-muted-foreground italic">Empty slide</span>}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {slide.copy.length} chars • {slide.copy.split(/\s+/).filter(w => w).length} words
                          </span>
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
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                navigator.clipboard.writeText(slide.copy);
                                showNotification('success', 'Copied to clipboard!');
                              }}
                            >
                              📋
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={addSlide}
                disabled={saving}
              >
                + Add New Slide
              </Button>
            </div>
          </CardContent>
        </Card>
          </div>
        )}

        {/* Image Search Modal */}
        {showImageSearch && (
          <ImageSearch
            onSelectImage={handleImageSelect}
            onClose={() => setShowImageSearch(false)}
          />
        )}
      </div>
    </main>
  );
}
