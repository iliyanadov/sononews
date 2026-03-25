import express from 'express';
import { prisma } from '@/lib/prisma';
import { claudeService } from '@/services/ai';
import { PostStatus } from '@sononews/shared';

const router = express.Router();

// POST /api/drafts - Create draft from alert
router.post('/', async (req, res) => {
  try {
    const { sourcePostId } = req.body;

    if (!sourcePostId) {
      return res.status(400).json({ error: 'sourcePostId is required' });
    }

    // Verify source post exists
    const sourcePost = await prisma.sourcePost.findUnique({
      where: { id: sourcePostId },
    });

    if (!sourcePost) {
      return res.status(404).json({ error: 'Source post not found' });
    }

    // Create draft
    const draft = await prisma.carouselDraft.create({
      data: {
        sourcePostId,
      },
    });

    // Update source post status
    await prisma.sourcePost.update({
      where: { id: sourcePostId },
      data: { status: PostStatus.DRAFTING },
    });

    // Get brand voice from settings
    const settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    });

    // Trigger AI content generation (fire and forget for now)
    claudeService
      .generateContent({
        tweetText: sourcePost.text,
        brandVoice: settings?.brandVoice || undefined,
        draftId: draft.id,
      })
      .then(async (content) => {
        // Update draft with generated content
        await prisma.carouselDraft.update({
          where: { id: draft.id },
          data: {
            headline: content.headlines[0],
            subCaption: content.subCaptions[0],
          },
        });

        // Create slides
        const slides = content.extensionSlides.map((slide) => ({
          draftId: draft.id,
          position: slide.position,
          copy: slide.copy,
          isAiGenerated: true,
        }));

        await prisma.slide.createMany({
          data: slides,
        });

        console.log(`[Drafts] AI generation complete for draft ${draft.id}`);
      })
      .catch((error) => {
        console.error(`[Drafts] AI generation failed for draft ${draft.id}:`, error);
      });

    res.status(201).json({
      draftId: draft.id,
      message: 'Draft created and AI generation started',
    });
  } catch (error) {
    console.error('[Drafts] Create failed:', error);
    res.status(500).json({ error: 'Failed to create draft' });
  }
});

// GET /api/drafts/:id - Get draft by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const draft = await prisma.carouselDraft.findUnique({
      where: { id },
      include: {
        sourcePost: true,
        slides: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    res.json({
      id: draft.id,
      sourcePostId: draft.sourcePostId,
      sourcePost: {
        id: draft.sourcePost.id,
        text: draft.sourcePost.text,
        mediaUrls: draft.sourcePost.mediaUrls,
        postedAt: draft.sourcePost.postedAt,
      },
      headline: draft.headline,
      subCaption: draft.subCaption,
      thumbnailUrl: draft.thumbnailUrl,
      slides: draft.slides.map((slide) => ({
        id: slide.id,
        position: slide.position,
        copy: slide.copy,
        isAiGenerated: slide.isAiGenerated,
      })),
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
    });
  } catch (error) {
    console.error('[Drafts] Get failed:', error);
    res.status(500).json({ error: 'Failed to fetch draft' });
  }
});

// GET /api/drafts - List all drafts
router.get('/', async (req, res) => {
  try {
    const { limit = '20', offset = '0' } = req.query;

    const drafts = await prisma.carouselDraft.findMany({
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      orderBy: { createdAt: 'desc' },
      include: {
        sourcePost: {
          select: {
            id: true,
            text: true,
            postedAt: true,
            currentLph: true,
          },
        },
        slides: {
          select: {
            id: true,
            position: true,
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    const total = await prisma.carouselDraft.count();

    res.json({
      drafts: drafts.map((draft) => ({
        id: draft.id,
        sourcePostId: draft.sourcePostId,
        sourcePost: draft.sourcePost,
        headline: draft.headline,
        subCaption: draft.subCaption,
        slideCount: draft.slides.length,
        thumbnailUrl: draft.thumbnailUrl,
        createdAt: draft.createdAt,
        updatedAt: draft.updatedAt,
      })),
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    console.error('[Drafts] List failed:', error);
    res.status(500).json({ error: 'Failed to list drafts' });
  }
});

// PATCH /api/drafts/:id - Update draft
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { headline, subCaption, thumbnailUrl } = req.body;

    const draft = await prisma.carouselDraft.update({
      where: { id },
      data: {
        ...(headline !== undefined && { headline }),
        ...(subCaption !== undefined && { subCaption }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
      },
    });

    res.json(draft);
  } catch (error) {
    console.error('[Drafts] Update failed:', error);
    res.status(500).json({ error: 'Failed to update draft' });
  }
});

// POST /api/drafts/:id/regenerate - Regenerate content
router.post('/:id/regenerate', async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'all' } = req.body; // 'headline', 'subCaption', 'slides', 'all'

    const draft = await prisma.carouselDraft.findUnique({
      where: { id },
      include: { sourcePost: true },
    });

    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    const settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    });

    // Handle regeneration based on type
    if (type === 'headline' || type === 'all') {
      const headlines = await claudeService.regenerateHeadline({
        draftId: id,
        currentHeadline: draft.headline,
        currentSubCaption: draft.subCaption,
        tweetText: draft.sourcePost.text,
        brandVoice: settings?.brandVoice || undefined,
      });

      await prisma.carouselDraft.update({
        where: { id },
        data: { headline: headlines[0] },
      });

      if (type === 'headline') {
        return res.json({ headlines, selected: headlines[0] });
      }
    }

    if (type === 'subCaption' || type === 'all') {
      const subCaptions = await claudeService.regenerateSubCaption({
        draftId: id,
        currentHeadline: draft.headline,
        currentSubCaption: draft.subCaption,
        tweetText: draft.sourcePost.text,
        brandVoice: settings?.brandVoice || undefined,
      });

      await prisma.carouselDraft.update({
        where: { id },
        data: { subCaption: subCaptions[0] },
      });

      if (type === 'subCaption') {
        return res.json({ subCaptions, selected: subCaptions[0] });
      }
    }

    if (type === 'slides' || type === 'all') {
      const slideCount = await prisma.slide.count({ where: { draftId: id } }) || 5;

      const slides = await claudeService.regenerateAllSlides({
        draftId: id,
        currentHeadline: draft.headline,
        currentSubCaption: draft.subCaption,
        tweetText: draft.sourcePost.text,
        slideCount,
        brandVoice: settings?.brandVoice || undefined,
      });

      // Delete old slides and create new ones
      await prisma.slide.deleteMany({ where: { draftId: id } });

      await prisma.slide.createMany({
        data: slides.map((slide) => ({
          draftId: id,
          position: slide.position,
          copy: slide.copy,
          isAiGenerated: true,
        })),
      });

      if (type === 'slides') {
        return res.json({ slides });
      }
    }

    // For 'all' type, return the updated draft
    const updatedDraft = await prisma.carouselDraft.findUnique({
      where: { id },
      include: {
        slides: {
          orderBy: { position: 'asc' },
        },
      },
    });

    res.json(updatedDraft);
  } catch (error) {
    console.error('[Drafts] Regenerate failed:', error);
    res.status(500).json({ error: 'Failed to regenerate content' });
  }
});

// POST /api/drafts/:id/slides/:pos/reprompt - Reprompt specific slide
router.post('/:id/slides/:position/reprompt', async (req, res) => {
  try {
    const { id, position } = req.params;
    const pos = parseInt(position);

    const draft = await prisma.carouselDraft.findUnique({
      where: { id },
      include: { sourcePost: true },
    });

    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    const slide = await prisma.slide.findUnique({
      where: {
        draftId_position: {
          draftId: id,
          position: pos,
        },
      },
    });

    if (!slide) {
      return res.status(404).json({ error: 'Slide not found' });
    }

    const settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    });

    const slideCount = await prisma.slide.count({ where: { draftId: id } });

    const newCopy = await claudeService.repromptSlide({
      draftId: id,
      slidePosition: pos,
      currentCopy: slide.copy,
      tweetText: draft.sourcePost.text,
      slideCount,
      brandVoice: settings?.brandVoice || undefined,
    });

    const updatedSlide = await prisma.slide.update({
      where: { id: slide.id },
      data: { copy: newCopy, isAiGenerated: false }, // Mark as user-edited
    });

    res.json(updatedSlide);
  } catch (error) {
    console.error('[Drafts] Reprompt failed:', error);
    res.status(500).json({ error: 'Failed to reprompt slide' });
  }
});

// PATCH /api/drafts/:id/slides/:pos - Update specific slide
router.patch('/:id/slides/:position', async (req, res) => {
  try {
    const { id, position } = req.params;
    const { copy } = req.body;

    if (!copy) {
      return res.status(400).json({ error: 'copy is required' });
    }

    const slide = await prisma.slide.update({
      where: {
        draftId_position: {
          draftId: id,
          position: parseInt(position),
        },
      },
      data: { copy, isAiGenerated: false },
    });

    res.json(slide);
  } catch (error) {
    console.error('[Drafts] Update slide failed:', error);
    res.status(500).json({ error: 'Failed to update slide' });
  }
});

// DELETE /api/drafts/:id - Delete draft
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.carouselDraft.delete({
      where: { id },
    });

    res.json({ message: 'Draft deleted' });
  } catch (error) {
    console.error('[Drafts] Delete failed:', error);
    res.status(500).json({ error: 'Failed to delete draft' });
  }
});

export default router;
