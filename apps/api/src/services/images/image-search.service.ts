import { ImageSearchResult } from '@sononews/shared';
import { GoogleCSEAdapter, MockImageSearchAdapter } from './index';

interface ImageSearchAdapter {
  searchImages(query: string, count?: number): Promise<ImageSearchResult[]>;
}

const USE_MOCK_SEARCH = process.env.GOOGLE_CSE_API_KEY === 'your_google_api_key_here' ||
                        !process.env.GOOGLE_CSE_API_KEY ||
                        !process.env.GOOGLE_CSE_ID;

class ImageSearchService {
  private adapter: ImageSearchAdapter;

  constructor() {
    if (USE_MOCK_SEARCH) {
      console.log('[ImageSearch] Using mock adapter');
      this.adapter = new MockImageSearchAdapter();
    } else {
      console.log('[ImageSearch] Using Google CSE adapter');
      this.adapter = new GoogleCSEAdapter(
        process.env.GOOGLE_CSE_API_KEY!,
        process.env.GOOGLE_CSE_ID!
      );
    }
  }

  async searchImages(query: string, count: number = 10): Promise<ImageSearchResult[]> {
    if (!query || query.trim().length === 0) {
      throw new Error('Search query is required');
    }

    return this.adapter.searchImages(query, count);
  }
}

export const imageSearchService = new ImageSearchService();
