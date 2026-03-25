import { Job, Worker } from 'bullmq';
import { prisma } from '../lib/prisma';
import { getScraper } from '../services/scraper';
import { calculateLPH, shouldTriggerAlert } from '../services/scoring';
import { QUEUE_NAMES } from '@sononews/shared';
import { redis } from '../lib/redis';

/**
 * Scraper job processor - fetches timeline and updates posts in database
 */
export async function scrapeTimelineJob(job: Job) {
  console.log(`[ScraperJob] Starting scrape job ${job.id}`);

  try {
    const scraper = getScraper();
    const settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    });

    const threshold = settings?.lphThreshold ?? 500;

    // Fetch latest posts from timeline
    const sourceAccount = process.env.TWITTER_SOURCE_ACCOUNT || 'Kurrco';
    const scrapedPosts = await scraper.fetchUserTimeline(sourceAccount);

    let updatedCount = 0;
    let alertCount = 0;

    for (const scrapedPost of scrapedPosts) {
      const existingPost = await prisma.sourcePost.findUnique({
        where: { id: scrapedPost.id },
      });

      if (existingPost) {
        // Update existing post with new like count
        const { lph, snapshots } = calculateLPH(
          existingPost.postedAt,
          scrapedPost.likeCount,
          existingPost.likeSnapshots as any[]
        );

        await prisma.sourcePost.update({
          where: { id: scrapedPost.id },
          data: {
            likeSnapshots: snapshots as any,
            currentLph: lph,
            alertFired: shouldTriggerAlert(lph, threshold, existingPost.alertFired)
              ? true
              : existingPost.alertFired,
          },
        });

        // Check if we should fire an alert
        if (shouldTriggerAlert(lph, threshold, existingPost.alertFired)) {
          await prisma.sourcePost.update({
            where: { id: scrapedPost.id },
            data: { status: 'ALERTED' },
          });
          alertCount++;
          console.log(`🚨 Alert triggered for post ${scrapedPost.id} with LPH: ${lph}`);
        }

        updatedCount++;
      } else {
        // Create new post
        const { lph, snapshots } = calculateLPH(
          scrapedPost.postedAt,
          scrapedPost.likeCount,
          []
        );

        await prisma.sourcePost.create({
          data: {
            id: scrapedPost.id,
            text: scrapedPost.text,
            mediaUrls: scrapedPost.mediaUrls,
            postedAt: scrapedPost.postedAt,
            likeSnapshots: snapshots as any,
            currentLph: lph,
            alertFired: false,
            status: 'NEW',
          },
        });

        // Check if new post exceeds threshold immediately
        if (lph >= threshold) {
          await prisma.sourcePost.update({
            where: { id: scrapedPost.id },
            data: { status: 'ALERTED', alertFired: true },
          });
          alertCount++;
          console.log(`🚨 Alert triggered for new post ${scrapedPost.id} with LPH: ${lph}`);
        }

        console.log(`✅ Created new post ${scrapedPost.id} with LPH: ${lph}`);
      }
    }

    console.log(`[ScraperJob] Completed: ${updatedCount} posts updated, ${alertCount} alerts`);

    return {
      success: true,
      postsProcessed: scrapedPosts.length,
      postsUpdated: updatedCount,
      alertsTriggered: alertCount,
    };
  } catch (error) {
    console.error('[ScraperJob] Error:', error);
    throw error;
  }
}

/**
 * Create a scraper worker
 */
export function createScraperWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.SCRAPER,
    async (job: Job) => {
      return await scrapeTimelineJob(job);
    },
    {
      connection: redis,
      concurrency: 1,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[ScraperWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[ScraperWorker] Job ${job?.id} failed:`, err);
  });

  return worker;
}

/**
 * Schedule the scraper job to run on an interval
 */
export async function scheduleScraperJob(intervalMinutes: number = 15) {
  const settings = await prisma.settings.findUnique({
    where: { id: 'default' },
  });

  const pollInterval = settings?.pollIntervalMinutes ?? intervalMinutes;

  // This would typically be handled by a separate scheduler process
  // For now, we'll just log that it needs to be scheduled
  console.log(`[ScraperJob] Scheduler configured to run every ${pollInterval} minutes`);
  console.log('[ScraperJob] To manually trigger: POST /api/jobs/scraper/trigger');
}
