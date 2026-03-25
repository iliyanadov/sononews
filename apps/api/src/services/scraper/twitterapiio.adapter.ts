import { ScrapedPost, XScraperAdapter } from '@sononews/shared';

export class TwitterAPIIoAdapter implements XScraperAdapter {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.twitterapi.io/twitter';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async fetchUserTimeline(username: string, _sinceId?: string): Promise<ScrapedPost[]> {
    console.log(`[TwitterAPI] Fetching timeline for @${username}`);

    // Step 1: Get user info to convert username to userId
    const userInfoUrl = new URL(`${this.baseUrl}/user/info`);
    userInfoUrl.searchParams.set('userName', username);

    const userInfoResponse = await fetch(userInfoUrl.toString(), {
      headers: {
        'X-API-Key': this.apiKey,
      },
    });

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error(`[TwitterAPI] User info error: ${errorText}`);
      throw new Error(`TwitterAPI.io user info error: ${userInfoResponse.statusText}`);
    }

    const userInfoData = await userInfoResponse.json() as any;
    console.log(`[TwitterAPI] User info status: ${userInfoData.status}`);

    if (userInfoData.status !== 'success' || !userInfoData.data?.id) {
      throw new Error(`User @${username} not found`);
    }

    const userId = userInfoData.data.id;
    console.log(`[TwitterAPI] Got userId: ${userId}`);

    // Step 2: Fetch user timeline using userId
    const timelineUrl = new URL(`${this.baseUrl}/user/tweet_timeline`);
    timelineUrl.searchParams.set('userId', userId);

    const timelineResponse = await fetch(timelineUrl.toString(), {
      headers: {
        'X-API-Key': this.apiKey,
      },
    });

    if (!timelineResponse.ok) {
      const errorText = await timelineResponse.text();
      console.error(`[TwitterAPI] Timeline error: ${errorText}`);
      throw new Error(`TwitterAPI.io timeline error: ${timelineResponse.statusText}`);
    }

    const timelineData = await timelineResponse.json() as any;
    console.log(`[TwitterAPI] Timeline status: ${timelineData.status}`);

    // The response has nested structure: data.data.tweets
    // The response structure is: { data: { tweets: [...] } }
    const tweets = timelineData.data?.tweets || [];
    console.log(`[TwitterAPI] Found ${tweets.length} tweets`);

    return tweets.map((tweet: any) => ({
      id: tweet.id,
      text: tweet.text,
      mediaUrls: tweet.entities?.urls?.map((u: any) => u.expanded_url).filter(Boolean) || [],
      postedAt: new Date(tweet.createdAt),
      likeCount: tweet.likeCount || 0,
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
