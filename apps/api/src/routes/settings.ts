import express, { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';

const router = express.Router();

// GET /api/settings - Retrieve operator settings
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      // Return defaults if not found
      res.json({
        lphThreshold: 500,
        pollIntervalMinutes: 15,
        monitoringWindowHrs: 24,
        brandVoice: '',
        pushNotifications: true,
      });
      return;
    }

    res.json({
      lphThreshold: settings.lphThreshold,
      pollIntervalMinutes: settings.pollIntervalMinutes,
      monitoringWindowHrs: settings.monitoringWindowHrs,
      brandVoice: settings.brandVoice,
      pushNotifications: settings.pushNotifications,
    });
  } catch (error) {
    console.error('[Settings] Get failed:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PATCH /api/settings - Update operator settings
router.patch('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      lphThreshold,
      pollIntervalMinutes,
      monitoringWindowHrs,
      brandVoice,
      pushNotifications,
    } = req.body;

    const settings = await prisma.settings.upsert({
      where: { id: 'default' },
      update: {
        ...(lphThreshold !== undefined && { lphThreshold }),
        ...(pollIntervalMinutes !== undefined && { pollIntervalMinutes }),
        ...(monitoringWindowHrs !== undefined && { monitoringWindowHrs }),
        ...(brandVoice !== undefined && { brandVoice }),
        ...(pushNotifications !== undefined && { pushNotifications }),
      },
      create: {
        id: 'default',
        lphThreshold: lphThreshold || 500,
        pollIntervalMinutes: pollIntervalMinutes || 15,
        monitoringWindowHrs: monitoringWindowHrs || 24,
        brandVoice: brandVoice || '',
        pushNotifications: pushNotifications !== undefined ? pushNotifications : true,
      },
    });

    res.json({
      lphThreshold: settings.lphThreshold,
      pollIntervalMinutes: settings.pollIntervalMinutes,
      monitoringWindowHrs: settings.monitoringWindowHrs,
      brandVoice: settings.brandVoice,
      pushNotifications: settings.pushNotifications,
      updatedAt: settings.updatedAt,
    });
  } catch (error) {
    console.error('[Settings] Update failed:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
