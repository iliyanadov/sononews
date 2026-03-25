import { Queue } from 'bullmq';
import { redis } from '../lib/redis';
import { QUEUE_NAMES } from '@sononews/shared';

export const scraperQueue = new Queue(QUEUE_NAMES.SCRAPER, {
  connection: redis,
});

export * from './scraper.job';
