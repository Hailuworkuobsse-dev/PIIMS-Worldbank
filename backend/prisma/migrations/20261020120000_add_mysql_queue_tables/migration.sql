-- Add the MySQL-backed queue and idempotency tables used by the application.
-- These models were added to schema.prisma after the initial migration.

CREATE TABLE `jobs` (
    `jobId` CHAR(36) NOT NULL,
    `queue` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `payload` JSON NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    `attemptsMade` INTEGER NOT NULL DEFAULT 0,
    `maxAttempts` INTEGER NOT NULL DEFAULT 3,
    `runAfter` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `startedAt` DATETIME(3) NULL,
    `finishedAt` DATETIME(3) NULL,
    `error` TEXT NULL,
    `externalId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `jobs_externalId_key`(`externalId`),
    INDEX `jobs_queue_status_runAfter_idx`(`queue`, `status`, `runAfter`),
    PRIMARY KEY (`jobId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `idempotency_keys` (
    `key` VARCHAR(191) NOT NULL,
    `response` LONGTEXT NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idempotency_keys_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
