import { ImageSearchResult } from '@sononews/shared';

export class GoogleCSEAdapter {
  private readonly apiKey: string;
  private readonly searchEngineId: string;
  private readonly baseUrl = 'https://www.googleapis.com/customsearch/v1';

  constructor(apiKey: string, searchEngineId: string) {
    this.apiKey = apiKey;
    this.searchEngineId = searchEngineId;
  }

  async searchImages(query: string, count: number = 10): Promise<ImageSearchResult[]> {
    console.log(`[GoogleCSE] Searching for images: "${query}"`);

    const url = new URL(this.baseUrl);
    url.searchParams.set('key', this.apiKey);
    url.searchParams.set('cx', this.searchEngineId);
    url.searchParams.set('q', query);
    url.searchParams.set('searchType', 'image');
    url.searchParams.set('num', count.toString());
    url.searchParams.set('imgSize', 'large'); // Get high-quality images
    url.searchParams.set('imgType', 'photo'); // Photos only, not illustrations
    url.searchParams.set('safe', 'active'); // Safe search

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GoogleCSE] Search error: ${errorText}`);
      throw new Error(`Google CSE error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    const items = data.items || [];

    console.log(`[GoogleCSE] Found ${items.length} images`);

    return items.map((item: any) => ({
      url: item.link,
      thumbnail: item.image?.thumbnailLink || item.link,
      width: item.image?.width || 0,
      height: item.image?.height || 0,
    }));
  }
}
