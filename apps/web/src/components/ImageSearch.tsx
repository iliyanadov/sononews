'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Image {
  url: string;
  thumbnail: string;
  width: number;
  height: number;
}

interface ImageSearchProps {
  onSelectImage: (imageUrl: string) => void;
  onClose: () => void;
  allowUpload?: boolean;
}

export function ImageSearch({ onSelectImage, onClose, allowUpload = true }: ImageSearchProps) {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/images/search?q=${encodeURIComponent(query)}&count=12`
      );
      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      setImages(data.images || []);
    } catch (error) {
      console.error('Image search failed:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Convert file to base64 data URL
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        onSelectImage(dataUrl);
        onClose();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File upload failed:', error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Search Images</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>

          {allowUpload && (
            <div className="mb-4 p-4 border-2 border-dashed rounded-lg text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-2xl mb-1">📁</div>
                <p className="text-sm font-medium">
                  {uploading ? 'Uploading...' : 'Click to upload an image'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports JPG, PNG, GIF, WebP
                </p>
              </label>
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search for images..."
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {searched && images.length === 0 && !loading && (
            <div className="text-center text-muted-foreground py-8">
              No images found. Try a different search term.
            </div>
          )}

          {!searched && !loading && (
            <div className="text-center text-muted-foreground py-8">
              Enter a search term to find images for your carousel
            </div>
          )}

          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto max-h-[400px]">
              {images.map((image, index) => (
                <div
                  key={index}
                  className="relative group cursor-pointer border rounded-lg overflow-hidden hover:ring-2 hover:ring-primary"
                  onClick={() => onSelectImage(image.url)}
                >
                  <img
                    src={image.thumbnail}
                    alt={`Search result ${index + 1}`}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm">Click to select</span>
                  </div>
                  {image.width > 0 && image.height > 0 && (
                    <Badge variant="secondary" className="absolute bottom-1 right-1 text-xs">
                      {image.width}×{image.height}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
