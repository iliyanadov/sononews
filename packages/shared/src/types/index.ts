export enum PostStatus {
  NEW = 'NEW',
  ALERTED = 'ALERTED',
  DRAFTING = 'DRAFTING',
  PUBLISHED = 'PUBLISHED',
  DISMISSED = 'DISMISSED',
}

export interface SourcePost {
  id: string;
  text: string;
  mediaUrls: string[];
  postedAt: Date;
  likeSnapshots: LikeSnapshot[];
  currentLph: number;
  alertFired: boolean;
  status: PostStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface LikeSnapshot {
  count: number;
  scrapedAt: string;
}

export interface CarouselDraft {
  id: string;
  sourcePostId: string;
  headline: string;
  subCaption: string;
  thumbnailUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Slide {
  id: string;
  draftId: string;
  position: number;
  copy: string;
  isAiGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Settings {
  id: string;
  lphThreshold: number;
  pollIntervalMinutes: number;
  monitoringWindowHrs: number;
  brandVoice: string;
  pushNotifications: boolean;
  updatedAt: Date;
}

export interface AiLog {
  id: string;
  draftId: string | null;
  prompt: string;
  response: string;
  model: string;
  createdAt: Date;
}

export interface ScrapedPost {
  id: string;
  text: string;
  mediaUrls: string[];
  postedAt: Date;
  likeCount: number;
}

export interface XScraperAdapter {
  fetchUserTimeline(username: string, sinceId?: string): Promise<ScrapedPost[]>;
  fetchPostLikes(postId: string): Promise<number>;
}

export interface AlertPost {
  id: string;
  text: string;
  mediaUrls: string[];
  postedAt: Date;
  likeCount: number;
  currentLph: number;
  status: PostStatus;
}

export interface AiGeneratedContent {
  headlines: string[];
  subCaptions: string[];
  recommendedSlideCount: number;
  extensionSlides: Array<{
    position: number;
    copy: string;
  }>;
}

export interface ImageSearchResult {
  url: string;
  thumbnail: string;
  width: number;
  height: number;
}
