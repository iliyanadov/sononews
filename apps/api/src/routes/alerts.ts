import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();

const querySchema = z.object({
  includeDismissed: z.string().optional().transform((val) => val === 'true'),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 50)),
});

/**
 * GET /api/alerts
 * Fetch posts that have exceeded the LPH threshold
 */
router.get('/', async (req, res) => {
  try {
    const { includeDismissed, limit } = querySchema.parse(req.query);

    const posts = await prisma.sourcePost.findMany({
      where: {
        status: includeDismissed ? undefined : 'ALERTED',
      },
      orderBy: {
        currentLph: 'desc',
      },
      take: limit,
    });

    res.json({
      alerts: posts.map((post) => ({
        id: post.id,
        text: post.text,
        mediaUrls: post.mediaUrls,
        postedAt: post.postedAt,
        likeCount: post.likeSnapshots?.[post.likeSnapshots.length - 1]?.count || 0,
        currentLph: post.currentLph,
        status: post.status,
        alertFired: post.alertFired,
      })),
      total: posts.length,
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      error: 'Failed to fetch alerts',
    });
  }
});

/**
 * POST /api/alerts/:id/dismiss
 * Mark a post as dismissed
 */
router.post('/:id/dismiss', async (req, res) => {
  try {
    const { id } = req.params;

    const post = await prisma.sourcePost.update({
      where: { id },
      data: { status: 'DISMISSED' },
    });

    res.json({
      success: true,
      post: {
        id: post.id,
        status: post.status,
      },
    });
  } catch (error) {
    console.error('Error dismissing alert:', error);
    res.status(500).json({
      error: 'Failed to dismiss alert',
    });
  }
});

/**
 * POST /api/alerts/:id/create-draft
 * Create a draft from an alert post
 */
router.post('/:id/create-draft', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if post exists
    const post = await prisma.sourcePost.findUnique({
      where: { id },
    });

    if (!post) {
      return res.status(404).json({
        error: 'Post not found',
      });
    }

    // Create draft
    const draft = await prisma.carouselDraft.create({
      data: {
        sourcePostId: id,
      },
    });

    // Update post status
    await prisma.sourcePost.update({
      where: { id },
      data: { status: 'DRAFTING' },
    });

    res.json({
      success: true,
      draftId: draft.id,
      message: 'Draft created successfully',
    });
  } catch (error) {
    console.error('Error creating draft:', error);
    res.status(500).json({
      error: 'Failed to create draft',
    });
  }
});

export default router;
