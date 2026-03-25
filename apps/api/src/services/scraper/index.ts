import { XScraperAdapter } from '@sononews/shared';
import { MockXScraperAdapter } from './mock.adapter';
import { TwitterAPIIoAdapter } from './twitterapiio.adapter';

let scraperInstance: XScraperAdapter | null = null;

export function getScraper(): XScraperAdapter {
  if (scraperInstance) {
    return scraperInstance;
  }

  const apiKey = process.env.TWITTER_API_KEY;

  // Use real API if explicitly disabled mock mode AND we have an API key
  const useMock = process.env.USE_MOCK_SCRAPER !== 'false' || !apiKey;

  if (useMock) {
    console.log('📭 Using MockXScraperAdapter (development mode)');
    scraperInstance = new MockXScraperAdapter();
  } else {
    console.log('🐦 Using TwitterAPI.io adapter');
    scraperInstance = new TwitterAPIIoAdapter(apiKey);
  }

  return scraperInstance;
}

export { MockXScraperAdapter, TwitterAPIIoAdapter };
export * from './types';
