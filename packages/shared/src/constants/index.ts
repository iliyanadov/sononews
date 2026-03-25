export const DEFAULT_LPH_THRESHOLD = 500;
export const DEFAULT_POLL_INTERVAL_MINUTES = 15;
export const DEFAULT_MONITORING_WINDOW_HRS = 24;

// AI Models: Gemini Flash 2.0 for dev (free), Claude Haiku 4.5 for fallback/prod
export const AI_MODEL_DEV = 'gemini-flash';
export const AI_MODEL_PROD = 'claude-haiku-4-5';
export const AI_MODEL = process.env.NODE_ENV === 'production' ? AI_MODEL_PROD : AI_MODEL_DEV;

export const TWITTER_SOURCE_ACCOUNT = 'Kurrco';

export const QUEUE_NAMES = {
  SCRAPER: 'scraper',
  AI_GENERATION: 'ai-generation',
} as const;

export const JOB_NAMES = {
  SCRAPE_TIMELINE: 'scrape-timeline',
  GENERATE_DRAFT_CONTENT: 'generate-draft-content',
} as const;
