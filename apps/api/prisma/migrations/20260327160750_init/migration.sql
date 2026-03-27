-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('NEW', 'ALERTED', 'DRAFTING', 'PUBLISHED', 'DISMISSED');

-- CreateTable
CREATE TABLE "SourcePost" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "mediaUrls" TEXT[],
    "postedAt" TIMESTAMP(3) NOT NULL,
    "likeSnapshots" JSONB[],
    "currentLph" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "alertFired" BOOLEAN NOT NULL DEFAULT false,
    "status" "PostStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourcePost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarouselDraft" (
    "id" TEXT NOT NULL,
    "sourcePostId" TEXT NOT NULL,
    "headline" TEXT NOT NULL DEFAULT '',
    "subCaption" TEXT NOT NULL DEFAULT '',
    "thumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarouselDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Slide" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "copy" TEXT NOT NULL DEFAULT '',
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Slide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "lphThreshold" DOUBLE PRECISION NOT NULL DEFAULT 500,
    "pollIntervalMinutes" INTEGER NOT NULL DEFAULT 15,
    "monitoringWindowHrs" INTEGER NOT NULL DEFAULT 24,
    "brandVoice" TEXT NOT NULL DEFAULT '',
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiLog" (
    "id" TEXT NOT NULL,
    "draftId" TEXT,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Slide_draftId_position_key" ON "Slide"("draftId", "position");

-- AddForeignKey
ALTER TABLE "CarouselDraft" ADD CONSTRAINT "CarouselDraft_sourcePostId_fkey" FOREIGN KEY ("sourcePostId") REFERENCES "SourcePost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Slide" ADD CONSTRAINT "Slide_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "CarouselDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
