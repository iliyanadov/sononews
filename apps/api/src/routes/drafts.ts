import express, { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import { aiService } from '@/services/ai';
import { PostStatus, AiGeneratedContent } from '@sononews/shared';

const router = express.Router();

// POST /api/drafts - Create draft from alert
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sourcePostId } = req.body;

    if (!sourcePostId) {
      res.status(400).json({ error: 'sourcePostId is required' });
      return;
    }

    // Verify source post exists
    const sourcePost = await prisma.sourcePost.findUnique({
      where: { id: sourcePostId },
    });

    if (!sourcePost) {
      res.status(404).json({ error: 'Source post not found' });
      return;
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
    aiService
      .generateContent({
        tweetText: sourcePost.text,
        brandVoice: settings?.brandVoice || undefined,
        draftId: draft.id,
      })
      .then(async (content: AiGeneratedContent) => {
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
      .catch((error: Error) => {
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
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
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
      res.status(404).json({ error: 'Draft not found' });
      return;
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
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const drafts = await prisma.carouselDraft.findMany({
      take: limit,
      skip: offset,
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
      limit,
      offset,
    });
  } catch (error) {
    console.error('[Drafts] List failed:', error);
    res.status(500).json({ error: 'Failed to list drafts' });
  }
});

// PATCH /api/drafts/:id - Update draft
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
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
router.post('/:id/regenerate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { type = 'all' } = req.body; // 'headline', 'subCaption', 'slides', 'all'

    const draft = await prisma.carouselDraft.findUnique({
      where: { id },
      include: { sourcePost: true },
    });

    if (!draft) {
      res.status(404).json({ error: 'Draft not found' });
      return;
    }

    const settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    });

    // Handle regeneration based on type
    if (type === 'headline' || type === 'all') {
      const headlines = await aiService.regenerateHeadline({
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
        res.json({ headlines, selected: headlines[0] });
        return;
      }
    }

    if (type === 'subCaption' || type === 'all') {
      const subCaptions = await aiService.regenerateSubCaption({
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
        res.json({ subCaptions, selected: subCaptions[0] });
        return;
      }
    }

    if (type === 'slides' || type === 'all') {
      const slideCount = await prisma.slide.count({ where: { draftId: id } }) || 5;

      const slides = await aiService.regenerateAllSlides({
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
        data: slides.map((slide: { position: number; copy: string }) => ({
          draftId: id,
          position: slide.position,
          copy: slide.copy,
          isAiGenerated: true,
        })),
      });

      if (type === 'slides') {
        res.json({ slides });
        return;
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
router.post('/:id/slides/:position/reprompt', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, position } = req.params;
    const pos = parseInt(position);

    const draft = await prisma.carouselDraft.findUnique({
      where: { id },
      include: { sourcePost: true },
    });

    if (!draft) {
      res.status(404).json({ error: 'Draft not found' });
      return;
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
      res.status(404).json({ error: 'Slide not found' });
      return;
    }

    const settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    });

    const slideCount = await prisma.slide.count({ where: { draftId: id } });

    const newCopy = await aiService.repromptSlide({
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
router.patch('/:id/slides/:position', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, position } = req.params;
    const { copy } = req.body;

    if (!copy) {
      res.status(400).json({ error: 'copy is required' });
      return;
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

// DELETE /api/drafts/:id/slides/:pos - Delete specific slide
router.delete('/:id/slides/:position', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, position } = req.params;
    const posToDelete = parseInt(position);

    // Get all slides for this draft
    const allSlides = await prisma.slide.findMany({
      where: { draftId: id },
      orderBy: { position: 'asc' },
    });

    if (allSlides.length === 0) {
      res.status(404).json({ error: 'No slides found' });
      return;
    }

    // Delete the slide
    await prisma.slide.deleteMany({
      where: {
        draftId: id,
        position: posToDelete,
      },
    });

    // Reorder remaining slides
    const updatePromises = allSlides
      .filter(s => s.position > posToDelete)
      .map(slide =>
        prisma.slide.update({
          where: { id: slide.id },
          data: { position: slide.position - 1 },
        })
      );

    await Promise.all(updatePromises);

    res.json({ message: 'Slide deleted and remaining slides reordered' });
  } catch (error) {
    console.error('[Drafts] Delete slide failed:', error);
    res.status(500).json({ error: 'Failed to delete slide' });
  }
});

// POST /api/drafts/:id/slides - Add new slide
router.post('/:id/slides', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { position, copy } = req.body;

    // Get current max position
    const maxSlide = await prisma.slide.findFirst({
      where: { draftId: id },
      orderBy: { position: 'desc' },
    });

    const newPosition = position !== undefined
      ? parseInt(position as string)
      : (maxSlide?.position ?? 0) + 1;

    // If inserting in middle, shift existing slides down
    if (maxSlide && newPosition <= maxSlide.position) {
      await prisma.slide.updateMany({
        where: {
          draftId: id,
          position: { gte: newPosition },
        },
        data: {
          position: { increment: 1 },
        },
      });
    }

    const slide = await prisma.slide.create({
      data: {
        draftId: id,
        position: newPosition,
        copy: copy || '',
        isAiGenerated: false,
      },
    });

    res.json(slide);
  } catch (error) {
    console.error('[Drafts] Add slide failed:', error);
    res.status(500).json({ error: 'Failed to add slide' });
  }
});

// PUT /api/drafts/:id/slides/reorder - Reorder slides
router.put('/:id/slides/reorder', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { slideIds } = req.body; // Array of slide IDs in new order

    if (!Array.isArray(slideIds)) {
      res.status(400).json({ error: 'slideIds must be an array' });
      return;
    }

    // Update each slide's position
    const updatePromises = slideIds.map((slideId: string, index: number) =>
      prisma.slide.update({
        where: { id: slideId },
        data: { position: index + 1 },
      })
    );

    await Promise.all(updatePromises);

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
    console.error('[Drafts] Reorder slides failed:', error);
    res.status(500).json({ error: 'Failed to reorder slides' });
  }
});

// DELETE /api/drafts/:id - Delete draft
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
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
