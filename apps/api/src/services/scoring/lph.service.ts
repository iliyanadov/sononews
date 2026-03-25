import { LikeSnapshot } from '@sononews/shared';

export interface LPHCalculationResult {
  lph: number;
  snapshots: LikeSnapshot[];
}

/**
 * Calculates likes-per-hour (LPH) for a post based on like snapshots
 */
export function calculateLPH(
  postedAt: Date,
  currentLikeCount: number,
  existingSnapshots: LikeSnapshot[] = []
): LPHCalculationResult {
  const now = new Date();
  const hoursSincePost = (now.getTime() - postedAt.getTime()) / (1000 * 60 * 60);

  // Avoid division by zero for very new posts
  const effectiveHours = Math.max(hoursSincePost, 0.01);

  const lph = currentLikeCount / effectiveHours;

  // Add new snapshot
  const newSnapshot: LikeSnapshot = {
    count: currentLikeCount,
    scrapedAt: now.toISOString(),
  };

  // Keep only recent snapshots (last 24 hours worth of data)
  const snapshots = [...existingSnapshots, newSnapshot].filter(snapshot => {
    const snapshotTime = new Date(snapshot.scrapedAt).getTime();
    const hoursSinceSnapshot = (now.getTime() - snapshotTime) / (1000 * 60 * 60);
    return hoursSinceSnapshot <= 24;
  });

  return {
    lph: Math.round(lph * 100) / 100, // Round to 2 decimal places
    snapshots,
  };
}

/**
 * Determines if a post should trigger an alert based on LPH threshold
 */
export function shouldTriggerAlert(
  lph: number,
  threshold: number,
  alertFired: boolean
): boolean {
  return lph >= threshold && !alertFired;
}
