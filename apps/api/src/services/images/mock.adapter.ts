import { ImageSearchResult } from '@sononews/shared';

// Mock image data for development
const MOCK_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200',
    width: 800,
    height: 600,
  },
  {
    url: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=200',
    width: 800,
    height: 600,
  },
  {
    url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=200',
    width: 800,
    height: 600,
  },
  {
    url: 'https://images.unsplash.com/photo-1526478806334-5fd488fcaabc?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1526478806334-5fd488fcaabc?w=200',
    width: 800,
    height: 600,
  },
  {
    url: 'https://images.unsplash.com/photo-1484876065-a0f4c54ea8d5?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1484876065-a0f4c54ea8d5?w=200',
    width: 800,
    height: 600,
  },
  {
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200',
    width: 800,
    height: 600,
  },
  {
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200',
    width: 800,
    height: 600,
  },
  {
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200',
    width: 800,
    height: 600,
  },
  {
    url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=200',
    width: 800,
    height: 600,
  },
  {
    url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=200',
    width: 800,
    height: 600,
  },
];

export class MockImageSearchAdapter {
  async searchImages(query: string, count: number = 10): Promise<ImageSearchResult[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));

    console.log(`[MockImageSearch] Searching for: "${query}"`);

    // Return random subset of mock images
    const shuffled = [...MOCK_IMAGES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, MOCK_IMAGES.length));
  }
}
