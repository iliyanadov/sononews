import { createScraperWorker } from '../jobs/scraper.job';
import { prisma } from '../lib/prisma';

async function startWorker() {
  console.log('🎯 Starting SonoNews worker...');

  // Initialize default settings if they don't exist
  const settings = await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      lphThreshold: 500,
      pollIntervalMinutes: 15,
      monitoringWindowHrs: 24,
      brandVoice: '',
      pushNotifications: true,
    },
  });

  console.log(`⚙️ Settings loaded: LPH threshold = ${settings.lphThreshold}`);

  // Start scraper worker
  const scraperWorker = createScraperWorker();
  console.log('✅ Scraper worker started');

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down worker...');
    await scraperWorker.close();
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down worker...');
    await scraperWorker.close();
    await prisma.$disconnect();
    process.exit(0);
  });
}

startWorker().catch((error) => {
  console.error('❌ Worker failed to start:', error);
  process.exit(1);
});
