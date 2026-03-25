export const DEFAULT_LPH_THRESHOLD = 500;
export const DEFAULT_POLL_INTERVAL_MINUTES = 15;
export const DEFAULT_MONITORING_WINDOW_HRS = 24;

export const AI_MODEL = 'claude-sonnet-4-20250514';

export const TWITTER_SOURCE_ACCOUNT = 'Kurrco';

export const QUEUE_NAMES = {
  SCRAPER: 'scraper',
  AI_GENERATION: 'ai-generation',
} as const;

export const JOB_NAMES = {
  SCRAPE_TIMELINE: 'scrape-timeline',
  GENERATE_DRAFT_CONTENT: 'generate-draft-content',
} as const;
