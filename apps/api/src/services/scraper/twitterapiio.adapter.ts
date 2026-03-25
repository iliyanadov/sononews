import { ScrapedPost, XScraperAdapter } from '@sononews/shared';

export class TwitterAPIIoAdapter implements XScraperAdapter {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.twitterapi.io/twitter';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async fetchUserTimeline(username: string, sinceId?: string): Promise<ScrapedPost[]> {
    const url = new URL(`${this.baseUrl}/user/timeline`);
    url.searchParams.set('username', username);
    if (sinceId) {
      url.searchParams.set('since_id', sinceId);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`TwitterAPI.io error: ${response.statusText}`);
    }

    const data = await response.json() as { timeline?: any[] };

    return (data.timeline || []).map((tweet: any) => ({
      id: tweet.tweet_id,
      text: tweet.text,
      mediaUrls: tweet.media?.map((m: any) => m.media_url_https) || [],
      postedAt: new Date(tweet.created_at),
      likeCount: tweet.favorite_count || 0,
    }));
  }

  async fetchPostLikes(postId: string): Promise<number> {
    const url = new URL(`${this.baseUrl}/tweet/likes`);
    url.searchParams.set('tweet_id', postId);

    const response = await fetch(url.toString(), {
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`TwitterAPI.io error: ${response.statusText}`);
    }

    const data = await response.json() as { like_count?: number };
    return data.like_count || 0;
  }
}
