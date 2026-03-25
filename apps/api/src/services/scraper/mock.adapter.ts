import { ScrapedPost, XScraperAdapter } from '@sononews/shared';

// Full Twitter API response format
interface TwitterAPITweet {
  type: string;
  id: string;
  url: string;
  text: string;
  source: string;
  retweetCount: number;
  replyCount: number;
  likeCount: number;
  quoteCount: number;
  viewCount: number;
  createdAt: string;
  lang: string;
  bookmarkCount: number;
  isReply: boolean;
  inReplyToId?: string;
  conversationId: string;
  displayTextRange: number[];
  inReplyToUserId?: string;
  inReplyToUsername?: string;
  author: {
    type: string;
    userName: string;
    url: string;
    id: string;
    name: string;
    isBlueVerified: boolean;
    verifiedType: string;
    profilePicture: string;
    coverPicture: string;
    description: string;
    location: string;
    followers: number;
    following: number;
    canDm: boolean;
    createdAt: string;
    favouritesCount: number;
    hasCustomTimelines: boolean;
    isTranslator: boolean;
    mediaCount: number;
    statusesCount: number;
  };
  entities: {
    hashtags: Array<{ indices: number[]; text: string }>;
    urls: Array<{ display_url: string; expanded_url: string; indices: number[]; url: string }>;
    user_mentions: Array<{ id_str: string; name: string; screen_name: string }>;
  };
}

interface TwitterAPIResponse {
  tweets: TwitterAPITweet[];
  has_next_page: boolean;
  next_cursor: string;
  status: string;
  message: string;
}

// Mock data matching Twitter API format
function createMockTweet(id: string, text: string, postedAt: Date, mediaCount: number = 0): TwitterAPITweet {
  const hoursSincePost = (Date.now() - postedAt.getTime()) / (1000 * 60 * 60);
  const baseLikes = parseInt(id.slice(-1)) * 1000;
  const viralMultiplier = Math.pow(hoursSincePost, 1.5);
  const likeCount = Math.floor(baseLikes + (viralMultiplier * 2000) + Math.random() * 500);

  const hasMedia = mediaCount > 0;
  const mediaUrls: string[] = [];
  if (hasMedia) {
    for (let i = 0; i < mediaCount; i++) {
      mediaUrls.push(`https://pbs.twimg.com/media/${id}_${i}.jpg`);
    }
  }

  return {
    type: 'tweet',
    id,
    url: `https://x.com/Kurrco/status/${id}`,
    text,
    source: '<a href="https://about.twitter.com/products/tweetdeck" rel="nofollow">TweetDeck</a>',
    retweetCount: Math.floor(likeCount * 0.15),
    replyCount: Math.floor(likeCount * 0.05),
    likeCount,
    quoteCount: Math.floor(likeCount * 0.03),
    viewCount: Math.floor(likeCount * 25),
    createdAt: postedAt.toISOString(),
    lang: 'en',
    bookmarkCount: Math.floor(likeCount * 0.02),
    isReply: false,
    conversationId: id,
    displayTextRange: [0, text.length],
    author: {
      type: 'user',
      userName: 'Kurrco',
      url: 'https://x.com/Kurrco',
      id: '1419454889764311047',
      name: 'Kurr',
      isBlueVerified: false,
      verifiedType: 'none',
      profilePicture: 'https://pbs.twimg.com/profile_images/1617785265953189889/UY-4H3Xh_400x400.jpg',
      coverPicture: 'https://pbs.twimg.com/profile_banners/1419454889764311047/1678264715/1500x500',
      description: 'Hip-hop news, culture & everything in between. 🎵',
      location: 'Everywhere',
      followers: 142856,
      following: 842,
      canDm: false,
      createdAt: '2023-11-15T10:30:00.000Z',
      favouritesCount: 8421,
      hasCustomTimelines: false,
      isTranslator: false,
      mediaCount: 523,
      statusesCount: 12453,
    },
    entities: {
      hashtags: [],
      urls: [],
      user_mentions: [],
    },
  };
}

const MOCK_TWEET_DATA = [
  {
    text: '🚨 BREAKING: Drake and Future are reportedly working on a new collaborative album, expected to drop this summer. Sources say they\'ve been in the studio for the past month.',
    mediaCount: 1,
    minutesAgo: 30,
  },
  {
    text: 'Kendrick Lamar just announced a world tour for 2024. The "Big Steppers" tour will hit 40 cities across North America and Europe. Tickets go on sale next Friday.',
    mediaCount: 0,
    minutesAgo: 60,
  },
  {
    text: 'NEW MUSIC: Metro Boomin confirms he\'s producing tracks for the upcoming GTA VI soundtrack. "It\'s going to be epic," he tweeted.',
    mediaCount: 1,
    minutesAgo: 90,
  },
  {
    text: 'Rumor Control: Travis Scott spotted in the studio with Tyler, The Creator and Earl Sweatshirt. Could a collab project be in the works? 🤔',
    mediaCount: 1,
    minutesAgo: 120,
  },
  {
    text: 'J. Cole\'s "The Fall Off" might be coming sooner than expected. In a recent interview, he hinted that the album is in its final stages.',
    mediaCount: 0,
    minutesAgo: 150,
  },
  {
    text: '🔥 SZA teased a snippet of a new song on Instagram Stories, rumored to feature Don Toliver. Fans are already calling it "SOS deluxe era"',
    mediaCount: 1,
    minutesAgo: 180,
  },
  {
    text: 'Pusha T tweeted that his new album is "finished and fire." No release date yet, but he promised it\'s coming "sooner than you think."',
    mediaCount: 0,
    minutesAgo: 210,
  },
  {
    text: 'BREAKING: 21 Savage and Metro Boomin are reuniting for another "Savage Mode" album, according to industry insiders. The first one is expected next month.',
    mediaCount: 1,
    minutesAgo: 240,
  },
  {
    text: 'Cardi B confirmed she\'s been working with Pharrell Williams on new music. She posted a photo from the studio with the caption "Magic happening 🪄"',
    mediaCount: 1,
    minutesAgo: 270,
  },
  {
    text: 'Lil Baby announced he\'s launching his own record label. "It\'s time to give back and help the next generation," he said in a press statement.',
    mediaCount: 0,
    minutesAgo: 300,
  },
];

const MOCK_TWEETS = MOCK_TWEET_DATA.map((data, i) => {
  const id = `123456789${i}`;
  const postedAt = new Date(Date.now() - data.minutesAgo * 60 * 1000);
  return createMockTweet(id, data.text, postedAt, data.mediaCount);
});

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

    // Convert Twitter API format to ScrapedPost format
    return tweets.map((tweet) => ({
      id: tweet.id,
      text: tweet.text,
      mediaUrls: tweet.entities.urls
        ?.filter((u) => u.expanded_url?.includes('pbs.twimg.com'))
        .map((u) => u.expanded_url) || [],
      postedAt: new Date(tweet.createdAt),
      likeCount: tweet.likeCount,
    }));
  }

  async fetchPostLikes(postId: string): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));

    const tweet = MOCK_TWEETS.find(t => t.id === postId);
    if (!tweet) {
      throw new Error(`Post ${postId} not found`);
    }

    return tweet.likeCount;
  }
}
