import { Router } from 'express';
import { scraperQueue } from '../jobs';

const router = Router();

/**
 * POST /api/jobs/scraper/trigger
 * Manually trigger the scraper job
 */
router.post('/scraper/trigger', async (_req, res) => {
  try {
    const job = await scraperQueue.add('scrape-timeline', {}, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });

    res.json({
      success: true,
      jobId: job.id,
      message: 'Scraper job queued',
    });
  } catch (error) {
    console.error('Error triggering scraper job:', error);
    res.status(500).json({
      error: 'Failed to trigger scraper job',
    });
  }
});

/**
 * GET /api/jobs/scraper/status
 * Get the status of the scraper queue
 */
router.get('/scraper/status', async (_req, res) => {
  try {
    const counts = await scraperQueue.getJobCounts();

    res.json({
      queue: 'scraper',
      counts,
    });
  } catch (error) {
    console.error('Error getting queue status:', error);
    res.status(500).json({
      error: 'Failed to get queue status',
    });
  }
});

export default router;
