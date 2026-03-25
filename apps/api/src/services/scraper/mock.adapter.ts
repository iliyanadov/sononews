import { ScrapedPost, XScraperAdapter } from '@sononews/shared';

// Mock data with realistic hip-hop news tweets
const MOCK_TWEETS: Omit<ScrapedPost, 'likeCount'>[] = [
  {
    id: '1234567890',
    text: '🚨 BREAKING: Drake and Future are reportedly working on a new collaborative album, expected to drop this summer. Sources say they\'ve been in the studio for the past month.',
    mediaUrls: ['https://example.com/drake-future-studio.jpg'],
    postedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
  },
  {
    id: '1234567891',
    text: 'Kendrick Lamar just announced a world tour for 2024. The "Big Steppers" tour will hit 40 cities across North America and Europe. Tickets go on sale next Friday.',
    mediaUrls: [],
    postedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
  },
  {
    id: '1234567892',
    text: 'NEW MUSIC: Metro Boomin confirms he\'s producing tracks for the upcoming GTA VI soundtrack. "It\'s going to be epic," he tweeted.',
    mediaUrls: ['https://example.com/metro-gta.jpg'],
    postedAt: new Date(Date.now() - 1000 * 60 * 90), // 90 minutes ago
  },
  {
    id: '1234567893',
    text: 'Rumor Control: Travis Scott spotted in the studio with Tyler, The Creator and Earl Sweatshirt. Could a collab project be in the works? 🤔',
    mediaUrls: ['https://example.com/travis-studio.jpg'],
    postedAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
  },
  {
    id: '1234567894',
    text: 'J. Cole\'s "The Fall Off" might be coming sooner than expected. In a recent interview, he hinted that the album is in its final stages.',
    mediaUrls: [],
    postedAt: new Date(Date.now() - 1000 * 60 * 150), // 2.5 hours ago
  },
  {
    id: '1234567895',
    text: '🔥 SZA teased a snippet of a new song on Instagram Stories, rumored to feature Don Toliver. Fans are already calling it "SOS deluxe era"',
    mediaUrls: ['https://example.com-sza-tease.jpg'],
    postedAt: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
  },
  {
    id: '1234567896',
    text: 'Pusha T tweeted that his new album is "finished and fire." No release date yet, but he promised it\'s coming "sooner than you think."',
    mediaUrls: [],
    postedAt: new Date(Date.now() - 1000 * 60 * 210), // 3.5 hours ago
  },
  {
    id: '1234567897',
    text: 'BREAKING: 21 Savage and Metro Boomin are reuniting for another "Savage Mode" album, according to industry insiders. The first one is expected next month.',
    mediaUrls: ['https://example.com/21-metro.jpg'],
    postedAt: new Date(Date.now() - 1000 * 60 * 240), // 4 hours ago
  },
  {
    id: '1234567898',
    text: 'Cardi B confirmed she\'s been working with Pharrell Williams on new music. She posted a photo from the studio with the caption "Magic happening 🪄"',
    mediaUrls: ['https://example.com/cardi-pharrell.jpg'],
    postedAt: new Date(Date.now() - 1000 * 60 * 270), // 4.5 hours ago
  },
  {
    id: '1234567899',
    text: 'Lil Baby announced he\'s launching his own record label. "It\'s time to give back and help the next generation," he said in a press statement.',
    mediaUrls: [],
    postedAt: new Date(Date.now() - 1000 * 60 * 300), // 5 hours ago
  },
];

// Simulate like counts that grow over time
function getLikeCount(postId: string, postedAt: Date): number {
  const hoursSincePost = (Date.now() - postedAt.getTime()) / (1000 * 60 * 60);
  // Base likes + exponential growth to simulate viral content
  const baseLikes = parseInt(postId.slice(-1)) * 1000; // 0-9000 base likes
  const viralMultiplier = Math.pow(hoursSincePost, 1.5); // Viral growth curve
  const randomFactor = Math.random() * 500;
  return Math.floor(baseLikes + (viralMultiplier * 2000) + randomFactor);
}

export class MockXScraperAdapter implements XScraperAdapter {
  private called = 0;

  async fetchUserTimeline(username: string, sinceId?: string): Promise<ScrapedPost[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    this.called++;
    console.log(`[MockXScraper] fetchUserTimeline called (call #${this.called}) for @${username}`);

    let tweets = [...MOCK_TWEETS];

    // Filter by sinceId if provided
    if (sinceId) {
      const sinceIndex = tweets.findIndex(t => t.id === sinceId);
      if (sinceIndex !== -1) {
        tweets = tweets.slice(0, sinceIndex);
      }
    }

    // Add dynamic like counts
    return tweets.map(tweet => ({
      ...tweet,
      likeCount: getLikeCount(tweet.id, tweet.postedAt),
    }));
  }

  async fetchPostLikes(postId: string): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));

    const tweet = MOCK_TWEETS.find(t => t.id === postId);
    if (!tweet) {
      throw new Error(`Post ${postId} not found`);
    }

    return getLikeCount(postId, tweet.postedAt);
  }
}
