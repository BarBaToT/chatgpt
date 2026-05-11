-- CreateEnum
CREATE TYPE "ShopCategory" AS ENUM ('STIM', 'HARDWARE', 'SOFTWARE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "creds" INTEGER NOT NULL DEFAULT 500,
    "streetRep" INTEGER NOT NULL DEFAULT 0,
    "bandwidth" INTEGER NOT NULL DEFAULT 100,
    "bandwidthMax" INTEGER NOT NULL DEFAULT 100,
    "hardwareLevel" INTEGER NOT NULL DEFAULT 1,
    "softwareLevel" INTEGER NOT NULL DEFAULT 1,
    "lockedUntil" TIMESTAMP(3),
    "lastBandwidthRegen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Action" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "targetName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "energyCost" INTEGER NOT NULL,
    "requiredSoftwareReq" INTEGER NOT NULL DEFAULT 1,
    "successRateBase" INTEGER NOT NULL,
    "rewardCredsMin" INTEGER NOT NULL,
    "rewardCredsMax" INTEGER NOT NULL,
    "rewardRep" INTEGER NOT NULL,
    "lockoutMinutes" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HackLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "roll" INTEGER NOT NULL,
    "finalRate" INTEGER NOT NULL,
    "credsDelta" INTEGER NOT NULL DEFAULT 0,
    "repDelta" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HackLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopItem" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ShopCategory" NOT NULL,
    "cost" INTEGER NOT NULL,
    "bandwidthRestore" INTEGER NOT NULL DEFAULT 0,
    "hardwareDelta" INTEGER NOT NULL DEFAULT 0,
    "softwareDelta" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ShopItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_streetRep_idx" ON "User"("streetRep");

-- CreateIndex
CREATE UNIQUE INDEX "Action_slug_key" ON "Action"("slug");

-- CreateIndex
CREATE INDEX "HackLog_userId_createdAt_idx" ON "HackLog"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ShopItem_slug_key" ON "ShopItem"("slug");

-- AddForeignKey
ALTER TABLE "HackLog" ADD CONSTRAINT "HackLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HackLog" ADD CONSTRAINT "HackLog_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
