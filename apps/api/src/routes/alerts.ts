import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { aiService } from '../services/ai';

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
      alerts: posts.map((post) => {
        const lastSnapshot = Array.isArray(post.likeSnapshots)
          ? post.likeSnapshots[post.likeSnapshots.length - 1]
          : null;
        return {
          id: post.id,
          text: post.text,
          mediaUrls: post.mediaUrls,
          postedAt: post.postedAt,
          likeCount: (lastSnapshot as any)?.count || 0,
          currentLph: post.currentLph,
          status: post.status,
          alertFired: post.alertFired,
        };
      }),
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
router.post('/:id/create-draft', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if post exists
    const post = await prisma.sourcePost.findUnique({
      where: { id },
    });

    if (!post) {
      res.status(404).json({
        error: 'Post not found',
      });
      return;
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

    // Get brand voice from settings
    const settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    });

    // Trigger AI content generation (fire and forget)
    aiService
      .generateContent({
        tweetText: post.text,
        brandVoice: settings?.brandVoice || undefined,
        draftId: draft.id,
      })
      .then(async (content: { headlines: string[]; subCaptions: string[]; extensionSlides: Array<{ position: number; copy: string }> }) => {
        // Update draft with generated content
        await prisma.carouselDraft.update({
          where: { id: draft.id },
          data: {
            headline: content.headlines[0],
            subCaption: content.subCaptions[0],
          },
        });

        // Create slides
        const slides = content.extensionSlides.map((slide: { position: number; copy: string }) => ({
          draftId: draft.id,
          position: slide.position,
          copy: slide.copy,
          isAiGenerated: true,
        }));

        await prisma.slide.createMany({
          data: slides,
        });

        console.log(`[Alerts] AI generation complete for draft ${draft.id}`);
      })
      .catch((error: Error) => {
        console.error(`[Alerts] AI generation failed for draft ${draft.id}:`, error);
      });

    res.json({
      success: true,
      draftId: draft.id,
      message: 'Draft created and AI generation started',
    });
  } catch (error) {
    console.error('Error creating draft:', error);
    res.status(500).json({
      error: 'Failed to create draft',
    });
  }
});

export default router;
