import express, { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';

const router = express.Router();

interface ExportedSlide {
  position: number;
  copy: string;
  imageUrl?: string;
}

interface ExportedDraft {
  id: string;
  headline: string;
  subCaption: string;
  thumbnailUrl: string | null;
  sourcePost: {
    id: string;
    text: string;
    postedAt: string;
  };
  slides: ExportedSlide[];
  createdAt: string;
  updatedAt: string;
}

// GET /api/export/:draftId - Export draft as JSON
router.get('/:draftId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { draftId } = req.params;

    const draft = await prisma.carouselDraft.findUnique({
      where: { id: draftId },
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

    const exportedDraft: ExportedDraft = {
      id: draft.id,
      headline: draft.headline,
      subCaption: draft.subCaption,
      thumbnailUrl: draft.thumbnailUrl,
      sourcePost: {
        id: draft.sourcePost.id,
        text: draft.sourcePost.text,
        postedAt: draft.sourcePost.postedAt.toISOString(),
      },
      slides: draft.slides.map((slide: { position: number; copy: string }) => ({
        position: slide.position,
        copy: slide.copy,
      })),
      createdAt: draft.createdAt.toISOString(),
      updatedAt: draft.updatedAt.toISOString(),
    };

    res.json(exportedDraft);
  } catch (error) {
    console.error('[Export] Failed to export draft:', error);
    res.status(500).json({ error: 'Failed to export draft' });
  }
});

// GET /api/export/:draftId/download - Download draft as JSON file
router.get('/:draftId/download', async (req: Request, res: Response): Promise<void> => {
  try {
    const { draftId } = req.params;

    const draft = await prisma.carouselDraft.findUnique({
      where: { id: draftId },
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

    const exportedDraft: ExportedDraft = {
      id: draft.id,
      headline: draft.headline,
      subCaption: draft.subCaption,
      thumbnailUrl: draft.thumbnailUrl,
      sourcePost: {
        id: draft.sourcePost.id,
        text: draft.sourcePost.text,
        postedAt: draft.sourcePost.postedAt.toISOString(),
      },
      slides: draft.slides.map((slide: { position: number; copy: string }) => ({
        position: slide.position,
        copy: slide.copy,
      })),
      createdAt: draft.createdAt.toISOString(),
      updatedAt: draft.updatedAt.toISOString(),
    };

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${draft.headline.slice(0, 30).replace(/[^a-z0-9]/gi, '_')}_carousel.json"`
    );

    res.send(JSON.stringify(exportedDraft, null, 2));
  } catch (error) {
    console.error('[Export] Failed to download draft:', error);
    res.status(500).json({ error: 'Failed to download draft' });
  }
});

export default router;
