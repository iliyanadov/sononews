import express, { Request, Response } from 'express';
import { imageSearchService } from '@/services/images/image-search.service';

const router = express.Router();

// GET /api/images/search - Search for images
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, count = '10' } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({ error: 'Search query "q" is required' });
      return;
    }

    const imageCount = parseInt(count as string) || 10;
    const results = await imageSearchService.searchImages(q, imageCount);

    res.json({
      query: q,
      count: results.length,
      images: results,
    });
  } catch (error) {
    console.error('[Images] Search failed:', error);
    res.status(500).json({ error: 'Failed to search images' });
  }
});

export default router;
