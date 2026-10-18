-- CreateTable
CREATE TABLE `organizations` (
    `orgId` CHAR(36) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `nameAm` VARCHAR(200) NULL,
    `orgType` ENUM('WB', 'GOV_MINISTRY', 'GOV_AGENCY', 'FIN_INST', 'SUPPLIER', 'LOCAL_GOV', 'OTHER') NOT NULL,
    `level` ENUM('FEDERAL', 'REGIONAL', 'ZONAL', 'WOREDA', 'KEBELE') NOT NULL,
    `parentOrgId` CHAR(36) NULL,
    `address` TEXT NULL,
    `contactEmail` VARCHAR(120) NULL,
    `contactPhone` VARCHAR(20) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `effectiveFrom` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `effectiveTo` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `organizations_code_key`(`code`),
    INDEX `organizations_orgType_idx`(`orgType`),
    INDEX `organizations_level_idx`(`level`),
    INDEX `organizations_parentOrgId_idx`(`parentOrgId`),
    INDEX `organizations_status_idx`(`status`),
    PRIMARY KEY (`orgId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `roleId` CHAR(36) NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `scope` VARCHAR(20) NOT NULL,
    `permissions` JSON NOT NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_code_key`(`code`),
    PRIMARY KEY (`roleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `userId` CHAR(36) NOT NULL,
    `username` VARCHAR(60) NOT NULL,
    `email` VARCHAR(120) NOT NULL,
    `fullName` VARCHAR(200) NOT NULL,
    `fullNameAm` VARCHAR(200) NULL,
    `phone` VARCHAR(20) NULL,
    `orgId` CHAR(36) NOT NULL,
    `roleId` CHAR(36) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `mfaEnabled` BOOLEAN NOT NULL DEFAULT false,
    `mfaSecret` VARCHAR(255) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'LOCKED', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `lastLoginAt` DATETIME(3) NULL,
    `failedLoginCount` INTEGER NOT NULL DEFAULT 0,
    `lockedUntil` DATETIME(3) NULL,
    `passwordChangedAt` DATETIME(3) NULL,
    `locale` VARCHAR(10) NOT NULL DEFAULT 'en',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_orgId_idx`(`orgId`),
    INDEX `users_roleId_idx`(`roleId`),
    INDEX `users_status_idx`(`status`),
    INDEX `users_email_idx`(`email`),
    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `tokenId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `tokenHash` VARCHAR(128) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userAgent` VARCHAR(255) NULL,
    `ipAddress` VARCHAR(45) NULL,

    UNIQUE INDEX `refresh_tokens_tokenHash_key`(`tokenHash`),
    INDEX `refresh_tokens_userId_idx`(`userId`),
    INDEX `refresh_tokens_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`tokenId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `logId` BIGINT NOT NULL AUTO_INCREMENT,
    `userId` CHAR(36) NULL,
    `sessionId` CHAR(36) NULL,
    `entity` VARCHAR(60) NOT NULL,
    `entityId` CHAR(36) NULL,
    `action` ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'EXPORT', 'DOWNLOAD') NOT NULL,
    `oldValue` JSON NULL,
    `newValue` JSON NULL,
    `ipAddress` VARCHAR(45) NULL,
    `userAgent` VARCHAR(255) NULL,
    `correlationId` CHAR(36) NULL,
    `prevHash` VARCHAR(64) NULL,
    `recordHash` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `audit_logs_entity_entityId_idx`(`entity`, `entityId`),
    INDEX `audit_logs_action_idx`(`action`),
    INDEX `audit_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`logId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projects` (
    `projectId` CHAR(36) NOT NULL,
    `projectCode` VARCHAR(30) NOT NULL,
    `name` VARCHAR(300) NOT NULL,
    `nameAm` VARCHAR(300) NULL,
    `description` TEXT NULL,
    `sector` ENUM('WATER', 'ENERGY', 'BOTH', 'OTHER') NOT NULL,
    `subsector` VARCHAR(100) NULL,
    `status` ENUM('IDEA', 'PROFILE', 'PRE_FEASIBILITY', 'FEASIBILITY', 'APPRAISAL', 'APPROVED', 'ACTIVE', 'CLOSED', 'CANCELLED') NOT NULL DEFAULT 'IDEA',
    `stageGate` VARCHAR(50) NULL,
    `ownerOrgId` CHAR(36) NOT NULL,
    `locationId` CHAR(36) NULL,
    `totalBudget` DECIMAL(18, 2) NOT NULL,
    `currency` CHAR(3) NOT NULL,
    `wbCreditNo` VARCHAR(50) NULL,
    `approvalDate` DATE NULL,
    `startDate` DATE NULL,
    `endDate` DATE NULL,
    `actualStart` DATE NULL,
    `actualEnd` DATE NULL,
    `implementationArrangement` ENUM('PIU', 'LINE_MINISTRY', 'REGIONAL', 'OTHER') NULL,
    `financingSource` JSON NULL,
    `createdById` CHAR(36) NULL,
    `updatedById` CHAR(36) NULL,
    `deletedAt` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `projects_projectCode_key`(`projectCode`),
    INDEX `projects_status_idx`(`status`),
    INDEX `projects_sector_idx`(`sector`),
    INDEX `projects_ownerOrgId_idx`(`ownerOrgId`),
    INDEX `projects_locationId_idx`(`locationId`),
    INDEX `projects_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`projectId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `components` (
    `componentId` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `nameAm` VARCHAR(200) NULL,
    `description` TEXT NULL,
    `budget` DECIMAL(18, 2) NULL,
    `responsibleOrgId` CHAR(36) NULL,
    `orderNo` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `components_projectId_idx`(`projectId`),
    UNIQUE INDEX `components_projectId_code_key`(`projectId`, `code`),
    PRIMARY KEY (`componentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subcomponents` (
    `subcomponentId` CHAR(36) NOT NULL,
    `componentId` CHAR(36) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `nameAm` VARCHAR(200) NULL,
    `description` TEXT NULL,
    `budget` DECIMAL(18, 2) NULL,
    `responsibleOrgId` CHAR(36) NULL,
    `orderNo` INTEGER NOT NULL DEFAULT 0,
    `projectId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `subcomponents_componentId_idx`(`componentId`),
    INDEX `subcomponents_projectId_idx`(`projectId`),
    UNIQUE INDEX `subcomponents_componentId_code_key`(`componentId`, `code`),
    PRIMARY KEY (`subcomponentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `milestones` (
    `milestoneId` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `componentId` CHAR(36) NULL,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `plannedDate` DATE NOT NULL,
    `actualDate` DATE NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `ownerOrgId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `milestones_projectId_idx`(`projectId`),
    INDEX `milestones_status_idx`(`status`),
    INDEX `milestones_plannedDate_idx`(`plannedDate`),
    PRIMARY KEY (`milestoneId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `locations` (
    `locationId` CHAR(36) NOT NULL,
    `region` VARCHAR(100) NOT NULL,
    `regionCode` VARCHAR(10) NULL,
    `zone` VARCHAR(100) NULL,
    `woreda` VARCHAR(100) NULL,
    `kebele` VARCHAR(100) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `altitude` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `locations_region_idx`(`region`),
    INDEX `locations_zone_idx`(`zone`),
    INDEX `locations_woreda_idx`(`woreda`),
    PRIMARY KEY (`locationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `indicators` (
    `indicatorId` CHAR(36) NOT NULL,
    `subcomponentId` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `name` VARCHAR(300) NOT NULL,
    `nameAm` VARCHAR(300) NULL,
    `description` TEXT NULL,
    `indicatorType` ENUM('OUTPUT', 'OUTCOME', 'IMPACT') NOT NULL,
    `unit` VARCHAR(50) NOT NULL,
    `baseline` DECIMAL(18, 4) NULL,
    `baselineDate` DATE NULL,
    `target` DECIMAL(18, 4) NULL,
    `targetDate` DATE NULL,
    `actual` DECIMAL(18, 4) NULL,
    `frequency` ENUM('MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL') NOT NULL,
    `direction` ENUM('INCREASE', 'DECREASE') NOT NULL,
    `method` TEXT NULL,
    `disaggregation` JSON NULL,
    `status` ENUM('ON_TRACK', 'AT_RISK', 'OFF_TRACK', 'NOT_STARTED') NOT NULL DEFAULT 'NOT_STARTED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `indicators_projectId_idx`(`projectId`),
    INDEX `indicators_status_idx`(`status`),
    UNIQUE INDEX `indicators_subcomponentId_code_key`(`subcomponentId`, `code`),
    PRIMARY KEY (`indicatorId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `indicator_values` (
    `valueId` CHAR(36) NOT NULL,
    `indicatorId` CHAR(36) NOT NULL,
    `period` VARCHAR(20) NOT NULL,
    `fiscalYear` INTEGER NOT NULL,
    `value` DECIMAL(18, 4) NOT NULL,
    `target` DECIMAL(18, 4) NULL,
    `achievementPct` DECIMAL(5, 2) NULL,
    `disaggregation` JSON NULL,
    `dataSource` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `verifiedById` CHAR(36) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `indicator_values_indicatorId_idx`(`indicatorId`),
    INDEX `indicator_values_fiscalYear_idx`(`fiscalYear`),
    UNIQUE INDEX `indicator_values_indicatorId_period_key`(`indicatorId`, `period`),
    PRIMARY KEY (`valueId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `budgets` (
    `budgetId` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `componentId` CHAR(36) NULL,
    `fiscalYear` INTEGER NOT NULL,
    `currency` CHAR(3) NOT NULL,
    `appropriation` DECIMAL(18, 2) NOT NULL,
    `released` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `expended` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `committed` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `balance` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `fmisReference` VARCHAR(50) NULL,
    `lastSyncAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `budgets_projectId_idx`(`projectId`),
    INDEX `budgets_fiscalYear_idx`(`fiscalYear`),
    UNIQUE INDEX `budgets_projectId_componentId_fiscalYear_currency_key`(`projectId`, `componentId`, `fiscalYear`, `currency`),
    PRIMARY KEY (`budgetId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `disbursements` (
    `disbursementId` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `sourceOrgId` CHAR(36) NOT NULL,
    `category` ENUM('CATEGORY_1', 'CATEGORY_2', 'CATEGORY_3', 'OTHER') NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `currency` CHAR(3) NOT NULL,
    `amountEtb` DECIMAL(18, 2) NOT NULL,
    `valueDate` DATE NOT NULL,
    `referenceNo` VARCHAR(50) NULL,
    `status` ENUM('PLANNED', 'REQUESTED', 'APPROVED', 'DISBURSED', 'RECONCILED', 'REJECTED') NOT NULL DEFAULT 'APPROVED',
    `fmisReference` VARCHAR(50) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `disbursements_projectId_idx`(`projectId`),
    INDEX `disbursements_sourceOrgId_idx`(`sourceOrgId`),
    INDEX `disbursements_status_idx`(`status`),
    INDEX `disbursements_valueDate_idx`(`valueDate`),
    UNIQUE INDEX `disbursements_referenceNo_key`(`referenceNo`),
    PRIMARY KEY (`disbursementId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `procurement` (
    `procurementId` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `componentId` CHAR(36) NULL,
    `planRef` VARCHAR(50) NOT NULL,
    `description` TEXT NOT NULL,
    `method` ENUM('ICB', 'NCB', 'SHOPPING', 'DIRECT', 'OTHER') NOT NULL,
    `estimatedAmount` DECIMAL(18, 2) NULL,
    `currency` CHAR(3) NOT NULL,
    `planDate` DATE NULL,
    `advertisementDate` DATE NULL,
    `bidOpeningDate` DATE NULL,
    `evaluationDate` DATE NULL,
    `awardDate` DATE NULL,
    `status` ENUM('PLANNED', 'ADVERTISED', 'BID_OPEN', 'EVALUATED', 'AWARDED', 'CANCELLED') NOT NULL DEFAULT 'PLANNED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `procurement_projectId_idx`(`projectId`),
    INDEX `procurement_status_idx`(`status`),
    UNIQUE INDEX `procurement_projectId_planRef_key`(`projectId`, `planRef`),
    PRIMARY KEY (`procurementId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `suppliers` (
    `supplierId` CHAR(36) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `nameAm` VARCHAR(200) NULL,
    `tin` VARCHAR(20) NULL,
    `licenseNo` VARCHAR(50) NULL,
    `category` ENUM('MANUFACTURER', 'IMPORTER', 'INSTALLER', 'DISTRIBUTOR', 'OTHER') NOT NULL,
    `contactPerson` VARCHAR(120) NULL,
    `contactEmail` VARCHAR(120) NULL,
    `contactPhone` VARCHAR(20) NULL,
    `address` TEXT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'BLACKLISTED') NOT NULL DEFAULT 'ACTIVE',
    `performanceScore` DECIMAL(5, 2) NULL,
    `orgId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `suppliers_tin_key`(`tin`),
    INDEX `suppliers_status_idx`(`status`),
    INDEX `suppliers_category_idx`(`category`),
    PRIMARY KEY (`supplierId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `productId` CHAR(36) NOT NULL,
    `supplierId` CHAR(36) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `productType` ENUM('SHS', 'MINI_GRID', 'PUMP', 'LANTERN', 'OTHER') NOT NULL,
    `capacity` VARCHAR(50) NULL,
    `unitPrice` DECIMAL(18, 2) NULL,
    `currency` CHAR(3) NULL,
    `standardId` VARCHAR(50) NULL,
    `warrantyMonths` INTEGER NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `products_supplierId_idx`(`supplierId`),
    INDEX `products_productType_idx`(`productType`),
    PRIMARY KEY (`productId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contracts` (
    `contractId` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `procurementId` CHAR(36) NULL,
    `supplierId` CHAR(36) NOT NULL,
    `contractNo` VARCHAR(50) NOT NULL,
    `title` VARCHAR(300) NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `currency` CHAR(3) NOT NULL,
    `signedDate` DATE NULL,
    `startDate` DATE NULL,
    `endDate` DATE NULL,
    `status` ENUM('DRAFT', 'SIGNED', 'ACTIVE', 'COMPLETED', 'TERMINATED') NOT NULL DEFAULT 'DRAFT',
    `amendmentNo` INTEGER NOT NULL DEFAULT 0,
    `documentId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `contracts_contractNo_key`(`contractNo`),
    INDEX `contracts_projectId_idx`(`projectId`),
    INDEX `contracts_supplierId_idx`(`supplierId`),
    INDEX `contracts_status_idx`(`status`),
    PRIMARY KEY (`contractId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `beneficiaries` (
    `beneficiaryId` CHAR(36) NOT NULL,
    `uniqueId` VARCHAR(50) NOT NULL,
    `nationalId` VARCHAR(50) NULL,
    `fullName` VARCHAR(200) NOT NULL,
    `fullNameAm` VARCHAR(200) NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    `dateOfBirth` DATE NULL,
    `ageYears` INTEGER NULL,
    `householdSize` INTEGER NULL,
    `phone` VARCHAR(20) NULL,
    `locationId` CHAR(36) NOT NULL,
    `region` VARCHAR(100) NULL,
    `woreda` VARCHAR(100) NULL,
    `kebele` VARCHAR(100) NULL,
    `householdHead` BOOLEAN NOT NULL DEFAULT false,
    `vulnerability` JSON NULL,
    `registrationChannel` ENUM('WEB', 'SMS', 'USSD', 'CAPI', 'IMPORT', 'SUPPLIER') NOT NULL,
    `registrationDate` DATE NOT NULL,
    `verifiedById` CHAR(36) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `status` ENUM('REGISTERED', 'VERIFIED', 'ACTIVE', 'INACTIVE', 'DUPLICATE') NOT NULL DEFAULT 'REGISTERED',
    `dedupScore` DECIMAL(5, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `beneficiaries_uniqueId_key`(`uniqueId`),
    INDEX `beneficiaries_status_idx`(`status`),
    INDEX `beneficiaries_registrationChannel_idx`(`registrationChannel`),
    INDEX `beneficiaries_locationId_idx`(`locationId`),
    INDEX `beneficiaries_region_woreda_idx`(`region`, `woreda`),
    PRIMARY KEY (`beneficiaryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_deliveries` (
    `deliveryId` CHAR(36) NOT NULL,
    `beneficiaryId` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `supplierId` CHAR(36) NULL,
    `productId` CHAR(36) NULL,
    `serialNo` VARCHAR(80) NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `unit` VARCHAR(20) NULL,
    `installDate` DATE NULL,
    `installLat` DOUBLE NULL,
    `installLon` DOUBLE NULL,
    `installPhotoId` CHAR(36) NULL,
    `warrantyStart` DATE NULL,
    `warrantyEnd` DATE NULL,
    `status` ENUM('PLANNED', 'DELIVERED', 'INSTALLED', 'VERIFIED', 'FAILED') NOT NULL DEFAULT 'PLANNED',
    `verifiedById` CHAR(36) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `service_deliveries_serialNo_key`(`serialNo`),
    INDEX `service_deliveries_beneficiaryId_idx`(`beneficiaryId`),
    INDEX `service_deliveries_projectId_idx`(`projectId`),
    INDEX `service_deliveries_supplierId_idx`(`supplierId`),
    INDEX `service_deliveries_status_idx`(`status`),
    PRIMARY KEY (`deliveryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grievances` (
    `grievanceId` CHAR(36) NOT NULL,
    `ticketNo` VARCHAR(30) NOT NULL,
    `projectId` CHAR(36) NULL,
    `beneficiaryId` CHAR(36) NULL,
    `category` ENUM('SERVICE_QUALITY', 'DELAY', 'PAYMENT', 'SAFEGUARDS', 'CONDUCT', 'OTHER') NOT NULL,
    `subcategory` VARCHAR(100) NULL,
    `description` TEXT NOT NULL,
    `channel` ENUM('WEB', 'SMS', 'USSD', 'PHONE', 'IN_PERSON', 'LETTER') NOT NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `locationId` CHAR(36) NULL,
    `assignedToId` CHAR(36) NULL,
    `assignedAt` DATETIME(3) NULL,
    `slaDue` DATETIME(3) NOT NULL,
    `severity` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    `status` ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED') NOT NULL DEFAULT 'OPEN',
    `resolution` TEXT NULL,
    `resolvedAt` DATETIME(3) NULL,
    `escalatedToId` CHAR(36) NULL,
    `anonymous` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `grievances_ticketNo_key`(`ticketNo`),
    INDEX `grievances_status_idx`(`status`),
    INDEX `grievances_severity_idx`(`severity`),
    INDEX `grievances_category_idx`(`category`),
    INDEX `grievances_projectId_idx`(`projectId`),
    INDEX `grievances_slaDue_idx`(`slaDue`),
    PRIMARY KEY (`grievanceId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grievance_actions` (
    `actionId` CHAR(36) NOT NULL,
    `grievanceId` CHAR(36) NOT NULL,
    `actionType` ENUM('ASSIGN', 'RESPOND', 'ESCALATE', 'RESOLVE', 'CLOSE', 'REOPEN') NOT NULL,
    `actorId` CHAR(36) NOT NULL,
    `notes` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `grievance_actions_grievanceId_idx`(`grievanceId`),
    PRIMARY KEY (`actionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documents` (
    `docId` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NULL,
    `docType` ENUM('APPRAISAL', 'FEASIBILITY', 'CONTRACT', 'INVOICE', 'REPORT', 'INCEPTION', 'PROCUREMENT', 'LEGAL', 'TECHNICAL', 'OTHER') NOT NULL,
    `title` VARCHAR(300) NOT NULL,
    `description` TEXT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `filePath` VARCHAR(500) NOT NULL,
    `fileSize` BIGINT NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `checksum` VARCHAR(64) NOT NULL,
    `accessLevel` ENUM('PUBLIC', 'INTERNAL', 'RESTRICTED') NOT NULL DEFAULT 'INTERNAL',
    `tags` JSON NOT NULL,
    `uploadedById` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `documents_projectId_idx`(`projectId`),
    INDEX `documents_docType_idx`(`docType`),
    INDEX `documents_uploadedById_idx`(`uploadedById`),
    PRIMARY KEY (`docId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_versions` (
    `versionId` CHAR(36) NOT NULL,
    `docId` CHAR(36) NOT NULL,
    `version` INTEGER NOT NULL,
    `filePath` VARCHAR(500) NOT NULL,
    `fileSize` BIGINT NOT NULL,
    `checksum` VARCHAR(64) NOT NULL,
    `notes` TEXT NULL,
    `uploadedById` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `document_versions_docId_idx`(`docId`),
    UNIQUE INDEX `document_versions_docId_version_key`(`docId`, `version`),
    PRIMARY KEY (`versionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inception_reports` (
    `reportId` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `version` INTEGER NOT NULL,
    `templateId` CHAR(36) NULL,
    `submissionDate` DATE NULL,
    `dueDate` DATE NOT NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUIRED', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'DRAFT',
    `submittedById` CHAR(36) NULL,
    `reviewedById` CHAR(36) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `noObjection` BOOLEAN NOT NULL DEFAULT false,
    `noObjectionDate` DATE NULL,
    `documentId` CHAR(36) NULL,
    `summary` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `inception_reports_projectId_idx`(`projectId`),
    INDEX `inception_reports_status_idx`(`status`),
    INDEX `inception_reports_dueDate_idx`(`dueDate`),
    UNIQUE INDEX `inception_reports_projectId_version_key`(`projectId`, `version`),
    PRIMARY KEY (`reportId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `review_comments` (
    `commentId` CHAR(36) NOT NULL,
    `reportId` CHAR(36) NOT NULL,
    `sectionId` VARCHAR(50) NULL,
    `authorId` CHAR(36) NOT NULL,
    `text` TEXT NOT NULL,
    `resolved` BOOLEAN NOT NULL DEFAULT false,
    `resolvedById` CHAR(36) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `parentId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `review_comments_reportId_idx`(`reportId`),
    INDEX `review_comments_parentId_idx`(`parentId`),
    PRIMARY KEY (`commentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reports` (
    `reportId` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NULL,
    `reportType` ENUM('INCEPTION', 'PPMR', 'ISR', 'FINANCIAL', 'PROCUREMENT', 'BENEFICIARY', 'GRIEVANCE', 'IMPACT', 'AD_HOC') NOT NULL,
    `period` VARCHAR(30) NULL,
    `format` ENUM('PDF', 'EXCEL', 'CSV') NOT NULL,
    `filePath` VARCHAR(500) NULL,
    `fileSize` BIGINT NULL,
    `parameters` JSON NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'QUEUED',
    `error` TEXT NULL,
    `generatedById` CHAR(36) NOT NULL,
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `reports_projectId_idx`(`projectId`),
    INDEX `reports_reportType_idx`(`reportType`),
    INDEX `reports_status_idx`(`status`),
    INDEX `reports_generatedAt_idx`(`generatedAt`),
    PRIMARY KEY (`reportId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_schedules` (
    `scheduleId` CHAR(36) NOT NULL,
    `reportType` ENUM('INCEPTION', 'PPMR', 'ISR', 'FINANCIAL', 'PROCUREMENT', 'BENEFICIARY', 'GRIEVANCE', 'IMPACT', 'AD_HOC') NOT NULL,
    `cron` VARCHAR(100) NOT NULL,
    `recipients` JSON NOT NULL,
    `format` ENUM('PDF', 'EXCEL', 'CSV') NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `lastRunAt` DATETIME(3) NULL,
    `nextRunAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `report_schedules_active_idx`(`active`),
    PRIMARY KEY (`scheduleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `impact_domains` (
    `domainId` CHAR(36) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `nameAm` VARCHAR(100) NULL,
    `description` TEXT NULL,
    `orderNo` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `impact_domains_code_key`(`code`),
    PRIMARY KEY (`domainId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `impact_indicators` (
    `indicatorId` CHAR(36) NOT NULL,
    `domainId` CHAR(36) NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `name` VARCHAR(300) NOT NULL,
    `nameAm` VARCHAR(300) NULL,
    `description` TEXT NULL,
    `unit` VARCHAR(50) NOT NULL,
    `direction` ENUM('INCREASE', 'DECREASE') NOT NULL,
    `method` TEXT NULL,
    `disaggregation` JSON NULL,
    `isComposite` BOOLEAN NOT NULL DEFAULT false,
    `compositeFormula` JSON NULL,
    `standardRef` VARCHAR(100) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `effectiveFrom` DATE NOT NULL,
    `effectiveTo` DATE NULL,
    `status` ENUM('ACTIVE', 'DEPRECATED') NOT NULL DEFAULT 'ACTIVE',
    `createdById` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `impact_indicators_code_key`(`code`),
    INDEX `impact_indicators_domainId_idx`(`domainId`),
    INDEX `impact_indicators_status_idx`(`status`),
    PRIMARY KEY (`indicatorId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `indicator_waves` (
    `indicatorWaveId` CHAR(36) NOT NULL,
    `indicatorId` CHAR(36) NOT NULL,
    `waveId` CHAR(36) NOT NULL,
    `targetValue` DECIMAL(18, 4) NULL,
    `collectionWindowStart` DATE NULL,
    `collectionWindowEnd` DATE NULL,
    `required` BOOLEAN NOT NULL DEFAULT true,

    INDEX `indicator_waves_waveId_idx`(`waveId`),
    UNIQUE INDEX `indicator_waves_indicatorId_waveId_key`(`indicatorId`, `waveId`),
    PRIMARY KEY (`indicatorWaveId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `theory_of_change` (
    `tocId` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `diagramUrl` VARCHAR(500) NULL,
    `links` JSON NULL,
    `authorId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `theory_of_change_projectId_key`(`projectId`),
    PRIMARY KEY (`tocId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `surveys` (
    `surveyId` CHAR(36) NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `name` VARCHAR(300) NOT NULL,
    `nameAm` VARCHAR(300) NULL,
    `purpose` TEXT NULL,
    `projectId` CHAR(36) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'LOCKED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `currentVersionId` CHAR(36) NULL,
    `createdById` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `surveys_code_key`(`code`),
    PRIMARY KEY (`surveyId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `survey_versions` (
    `versionId` CHAR(36) NOT NULL,
    `surveyId` CHAR(36) NOT NULL,
    `versionNo` INTEGER NOT NULL,
    `publishedAt` DATETIME(3) NULL,
    `publishedById` CHAR(36) NULL,
    `locked` BOOLEAN NOT NULL DEFAULT false,
    `lockedAt` DATETIME(3) NULL,
    `xlsformRef` VARCHAR(500) NULL,
    `languages` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `survey_versions_surveyId_versionNo_key`(`surveyId`, `versionNo`),
    PRIMARY KEY (`versionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sections` (
    `sectionId` CHAR(36) NOT NULL,
    `versionId` CHAR(36) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `title` VARCHAR(300) NOT NULL,
    `titleAm` VARCHAR(300) NULL,
    `description` TEXT NULL,
    `orderNo` INTEGER NOT NULL DEFAULT 0,
    `repeatable` BOOLEAN NOT NULL DEFAULT false,
    `repeatMin` INTEGER NULL,
    `repeatMax` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sections_versionId_code_key`(`versionId`, `code`),
    PRIMARY KEY (`sectionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questions` (
    `questionId` CHAR(36) NOT NULL,
    `sectionId` CHAR(36) NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `type` ENUM('SINGLE', 'MULTI', 'NUMERIC', 'DECIMAL', 'DATE', 'TEXT', 'GPS', 'PHOTO', 'AUDIO', 'BARCODE', 'MATRIX', 'RANKING', 'CALCULATED') NOT NULL,
    `text` TEXT NOT NULL,
    `textAm` TEXT NULL,
    `hint` TEXT NULL,
    `required` BOOLEAN NOT NULL DEFAULT false,
    `orderNo` INTEGER NOT NULL DEFAULT 0,
    `validation` JSON NULL,
    `calculation` TEXT NULL,
    `indicatorId` CHAR(36) NULL,
    `disaggregationKey` VARCHAR(50) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `questions_indicatorId_idx`(`indicatorId`),
    UNIQUE INDEX `questions_sectionId_code_key`(`sectionId`, `code`),
    PRIMARY KEY (`questionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question_options` (
    `optionId` CHAR(36) NOT NULL,
    `questionId` CHAR(36) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `label` VARCHAR(300) NOT NULL,
    `labelAm` VARCHAR(300) NULL,
    `value` VARCHAR(50) NOT NULL,
    `orderNo` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `question_options_questionId_code_key`(`questionId`, `code`),
    PRIMARY KEY (`optionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `skip_logic` (
    `logicId` CHAR(36) NOT NULL,
    `questionId` CHAR(36) NOT NULL,
    `condition` TEXT NOT NULL,
    `action` ENUM('SKIP', 'SHOW', 'HIDE', 'REQUIRE') NOT NULL,
    `targetQuestionId` CHAR(36) NULL,

    INDEX `skip_logic_questionId_idx`(`questionId`),
    PRIMARY KEY (`logicId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `waves` (
    `waveId` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `waveType` ENUM('BASELINE', 'MIDLINE', 'ENDLINE', 'EX_POST') NOT NULL,
    `plannedStart` DATE NULL,
    `plannedEnd` DATE NULL,
    `actualStart` DATE NULL,
    `actualEnd` DATE NULL,
    `status` ENUM('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PLANNED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `waves_status_idx`(`status`),
    UNIQUE INDEX `waves_projectId_code_key`(`projectId`, `code`),
    PRIMARY KEY (`waveId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assignments` (
    `assignmentId` CHAR(36) NOT NULL,
    `waveId` CHAR(36) NOT NULL,
    `surveyVersionId` CHAR(36) NOT NULL,
    `collectorId` CHAR(36) NOT NULL,
    `supervisorId` CHAR(36) NULL,
    `region` VARCHAR(100) NULL,
    `woreda` VARCHAR(100) NULL,
    `targetCount` INTEGER NOT NULL DEFAULT 0,
    `completedCount` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ASSIGNED',
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dueDate` DATE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `assignments_waveId_idx`(`waveId`),
    INDEX `assignments_collectorId_idx`(`collectorId`),
    INDEX `assignments_status_idx`(`status`),
    PRIMARY KEY (`assignmentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `collectors` (
    `collectorId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `orgId` CHAR(36) NOT NULL,
    `employeeCode` VARCHAR(30) NULL,
    `region` VARCHAR(100) NULL,
    `woreda` VARCHAR(100) NULL,
    `deviceId` VARCHAR(100) NULL,
    `trainingDate` DATE NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `collectors_userId_key`(`userId`),
    INDEX `collectors_orgId_idx`(`orgId`),
    INDEX `collectors_status_idx`(`status`),
    PRIMARY KEY (`collectorId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supervisors` (
    `supervisorId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `orgId` CHAR(36) NOT NULL,
    `teamId` CHAR(36) NULL,
    `region` VARCHAR(100) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `supervisors_userId_key`(`userId`),
    INDEX `supervisors_orgId_idx`(`orgId`),
    PRIMARY KEY (`supervisorId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `submissions` (
    `submissionId` CHAR(36) NOT NULL,
    `assignmentId` CHAR(36) NOT NULL,
    `collectorId` CHAR(36) NOT NULL,
    `beneficiaryId` CHAR(36) NULL,
    `panelId` CHAR(36) NULL,
    `waveId` CHAR(36) NOT NULL,
    `surveyVersionId` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `startedAt` DATETIME(3) NOT NULL,
    `endedAt` DATETIME(3) NULL,
    `durationSeconds` INTEGER NULL,
    `gpsStartLat` DOUBLE NULL,
    `gpsStartLon` DOUBLE NULL,
    `gpsEndLat` DOUBLE NULL,
    `gpsEndLon` DOUBLE NULL,
    `deviceId` VARCHAR(100) NULL,
    `consentGiven` BOOLEAN NOT NULL DEFAULT false,
    `consentVersion` VARCHAR(20) NULL,
    `consentTypes` JSON NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'SYNCED', 'QA_REVIEW', 'QA_CLEARED', 'REJECTED') NOT NULL DEFAULT 'DRAFT',
    `qaStatus` ENUM('PENDING', 'FLAGGED', 'CLEARED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `syncedAt` DATETIME(3) NULL,
    `checksum` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `submissions_assignmentId_idx`(`assignmentId`),
    INDEX `submissions_collectorId_idx`(`collectorId`),
    INDEX `submissions_waveId_idx`(`waveId`),
    INDEX `submissions_status_qaStatus_idx`(`status`, `qaStatus`),
    INDEX `submissions_panelId_idx`(`panelId`),
    PRIMARY KEY (`submissionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `submission_answers` (
    `answerId` CHAR(36) NOT NULL,
    `submissionId` CHAR(36) NOT NULL,
    `questionId` CHAR(36) NOT NULL,
    `valueText` TEXT NULL,
    `valueNumeric` DECIMAL(18, 4) NULL,
    `valueDate` DATE NULL,
    `valueJson` JSON NULL,
    `valueGpsLat` DOUBLE NULL,
    `valueGpsLon` DOUBLE NULL,
    `answerType` ENUM('TEXT', 'NUMERIC', 'DATE', 'JSON', 'GPS', 'MEDIA') NOT NULL,
    `answeredAt` DATETIME(3) NULL,

    INDEX `submission_answers_submissionId_idx`(`submissionId`),
    INDEX `submission_answers_questionId_idx`(`questionId`),
    UNIQUE INDEX `submission_answers_submissionId_questionId_key`(`submissionId`, `questionId`),
    PRIMARY KEY (`answerId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `paradata` (
    `paradataId` CHAR(36) NOT NULL,
    `submissionId` CHAR(36) NOT NULL,
    `questionId` CHAR(36) NULL,
    `timeSpentMs` INTEGER NULL,
    `editCount` INTEGER NULL,
    `firstAnswerAt` DATETIME(3) NULL,
    `lastAnswerAt` DATETIME(3) NULL,
    `interrupted` BOOLEAN NULL,
    `deviceMeta` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `paradata_submissionId_idx`(`submissionId`),
    PRIMARY KEY (`paradataId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media_attachments` (
    `mediaId` CHAR(36) NOT NULL,
    `submissionId` CHAR(36) NULL,
    `type` ENUM('PHOTO', 'AUDIO', 'VIDEO', 'SIGNATURE') NOT NULL,
    `filePath` VARCHAR(500) NOT NULL,
    `fileSize` BIGINT NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `gpsLat` DOUBLE NULL,
    `gpsLon` DOUBLE NULL,
    `capturedAt` DATETIME(3) NOT NULL,
    `checksum` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `media_attachments_submissionId_idx`(`submissionId`),
    PRIMARY KEY (`mediaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consents` (
    `consentId` CHAR(36) NOT NULL,
    `submissionId` CHAR(36) NULL,
    `beneficiaryId` CHAR(36) NULL,
    `consentType` ENUM('PARTICIPATION', 'DATA_USE', 'FUTURE_RESEARCH', 'MEDIA', 'CONTACT') NOT NULL,
    `consentGiven` BOOLEAN NOT NULL,
    `consentVersion` VARCHAR(20) NOT NULL,
    `consentText` TEXT NOT NULL,
    `language` VARCHAR(10) NOT NULL,
    `givenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revokedAt` DATETIME(3) NULL,
    `revocationReason` TEXT NULL,
    `witnessName` VARCHAR(200) NULL,

    INDEX `consents_submissionId_idx`(`submissionId`),
    INDEX `consents_beneficiaryId_idx`(`beneficiaryId`),
    PRIMARY KEY (`consentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `qa_rules` (
    `ruleId` CHAR(36) NOT NULL,
    `code` VARCHAR(40) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `type` ENUM('DURATION_SHORT', 'DURATION_LONG', 'STRAIGHT_LINE', 'GPS_OUTSIDE', 'DUPLICATE', 'OUTLIER', 'SPEED', 'VARIANCE', 'LOGIC') NOT NULL,
    `threshold` JSON NOT NULL,
    `severity` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `qa_rules_code_key`(`code`),
    PRIMARY KEY (`ruleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `qa_flags` (
    `flagId` CHAR(36) NOT NULL,
    `submissionId` CHAR(36) NOT NULL,
    `ruleId` CHAR(36) NOT NULL,
    `severity` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    `details` JSON NULL,
    `status` ENUM('OPEN', 'IN_REVIEW', 'RESOLVED', 'ESCALATED') NOT NULL DEFAULT 'OPEN',
    `reviewedById` CHAR(36) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `resolution` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `qa_flags_submissionId_idx`(`submissionId`),
    INDEX `qa_flags_ruleId_idx`(`ruleId`),
    INDEX `qa_flags_status_idx`(`status`),
    INDEX `qa_flags_severity_idx`(`severity`),
    PRIMARY KEY (`flagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `back_checks` (
    `backcheckId` CHAR(36) NOT NULL,
    `submissionId` CHAR(36) NOT NULL,
    `supervisorId` CHAR(36) NOT NULL,
    `date` DATE NOT NULL,
    `result` ENUM('PASS', 'PARTIAL', 'FAIL') NOT NULL,
    `mismatchPct` DECIMAL(5, 2) NULL,
    `notes` TEXT NULL,
    `evidenceId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `back_checks_submissionId_idx`(`submissionId`),
    PRIMARY KEY (`backcheckId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `collector_scorecards` (
    `scorecardId` CHAR(36) NOT NULL,
    `collectorId` CHAR(36) NOT NULL,
    `waveId` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `submissionsCount` INTEGER NOT NULL DEFAULT 0,
    `flaggedCount` INTEGER NOT NULL DEFAULT 0,
    `backcheckPassRate` DECIMAL(5, 2) NULL,
    `avgDurationSeconds` INTEGER NULL,
    `compositeScore` DECIMAL(5, 2) NULL,
    `computedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `collector_scorecards_waveId_idx`(`waveId`),
    UNIQUE INDEX `collector_scorecards_collectorId_waveId_key`(`collectorId`, `waveId`),
    PRIMARY KEY (`scorecardId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `treatment_groups` (
    `groupId` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `groupType` ENUM('TREATMENT', 'CONTROL', 'PHASE_1', 'PHASE_2', 'COMPARISON') NOT NULL,
    `description` TEXT NULL,
    `assignedAt` DATE NOT NULL,
    `immutable` BOOLEAN NOT NULL DEFAULT true,
    `waveId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `treatment_groups_projectId_code_key`(`projectId`, `code`),
    PRIMARY KEY (`groupId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `panel_members` (
    `panelId` CHAR(36) NOT NULL,
    `beneficiaryId` CHAR(36) NULL,
    `householdId` CHAR(36) NULL,
    `treatmentGroupId` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `enrolledAt` DATE NOT NULL,
    `enrolledWaveId` CHAR(36) NOT NULL,
    `region` VARCHAR(100) NULL,
    `woreda` VARCHAR(100) NULL,
    `status` ENUM('ACTIVE', 'ATTRITED', 'REPLACED', 'WITHDRAWN') NOT NULL DEFAULT 'ACTIVE',
    `attritionReason` TEXT NULL,
    `replacedByPanelId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `panel_members_beneficiaryId_key`(`beneficiaryId`),
    INDEX `panel_members_treatmentGroupId_idx`(`treatmentGroupId`),
    INDEX `panel_members_projectId_idx`(`projectId`),
    INDEX `panel_members_status_idx`(`status`),
    PRIMARY KEY (`panelId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wave_datasets` (
    `datasetId` CHAR(36) NOT NULL,
    `waveId` CHAR(36) NOT NULL,
    `version` INTEGER NOT NULL,
    `recordCount` INTEGER NOT NULL,
    `buildStartedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `buildCompletedAt` DATETIME(3) NULL,
    `checksum` VARCHAR(64) NULL,
    `storagePath` VARCHAR(500) NULL,
    `status` ENUM('BUILDING', 'READY', 'RELEASED', 'ARCHIVED') NOT NULL DEFAULT 'BUILDING',

    INDEX `wave_datasets_waveId_idx`(`waveId`),
    UNIQUE INDEX `wave_datasets_waveId_version_key`(`waveId`, `version`),
    PRIMARY KEY (`datasetId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `anonymization_maps` (
    `mapId` CHAR(36) NOT NULL,
    `originalId` CHAR(36) NOT NULL,
    `anonymizedId` CHAR(36) NOT NULL,
    `level` ENUM('L0', 'L1', 'L2', 'L3') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `anonymization_maps_anonymizedId_idx`(`anonymizedId`),
    UNIQUE INDEX `anonymization_maps_originalId_level_key`(`originalId`, `level`),
    PRIMARY KEY (`mapId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `research_datasets` (
    `datasetId` CHAR(36) NOT NULL,
    `waveId` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `anonymizationLevel` ENUM('L0', 'L1', 'L2', 'L3') NOT NULL,
    `version` INTEGER NOT NULL,
    `formats` JSON NOT NULL,
    `recordCount` INTEGER NOT NULL,
    `releasedAt` DATETIME(3) NULL,
    `codebookRef` VARCHAR(500) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'DEPRECATED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `research_datasets_projectId_idx`(`projectId`),
    INDEX `research_datasets_status_idx`(`status`),
    UNIQUE INDEX `research_datasets_waveId_anonymizationLevel_version_key`(`waveId`, `anonymizationLevel`, `version`),
    PRIMARY KEY (`datasetId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `data_requests` (
    `requestId` CHAR(36) NOT NULL,
    `datasetId` CHAR(36) NOT NULL,
    `researcherName` VARCHAR(200) NOT NULL,
    `researcherEmail` VARCHAR(120) NOT NULL,
    `institution` VARCHAR(200) NOT NULL,
    `purpose` TEXT NOT NULL,
    `status` ENUM('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'SUBMITTED',
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `approvedById` CHAR(36) NULL,
    `approvedAt` DATETIME(3) NULL,
    `accessExpiresAt` DATETIME(3) NULL,
    `requesterId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `data_requests_datasetId_idx`(`datasetId`),
    INDEX `data_requests_status_idx`(`status`),
    PRIMARY KEY (`requestId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `data_use_agreements` (
    `duaId` CHAR(36) NOT NULL,
    `requestId` CHAR(36) NOT NULL,
    `signedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `signedByResearcher` BOOLEAN NOT NULL DEFAULT false,
    `signedByInstitution` BOOLEAN NOT NULL DEFAULT false,
    `signedByDataManager` BOOLEAN NOT NULL DEFAULT false,
    `filePath` VARCHAR(500) NULL,
    `expiryDate` DATE NULL,

    UNIQUE INDEX `data_use_agreements_requestId_key`(`requestId`),
    PRIMARY KEY (`duaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `research_projects` (
    `researchProjectId` CHAR(36) NOT NULL,
    `title` VARCHAR(300) NOT NULL,
    `leadResearcher` VARCHAR(200) NOT NULL,
    `institution` VARCHAR(200) NULL,
    `status` ENUM('REGISTERED', 'ACTIVE', 'COMPLETED', 'PUBLISHED') NOT NULL DEFAULT 'REGISTERED',
    `datasetIds` JSON NOT NULL,
    `startDate` DATE NULL,
    `endDate` DATE NULL,
    `projectId` CHAR(36) NULL,
    `createdById` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `research_projects_status_idx`(`status`),
    PRIMARY KEY (`researchProjectId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `publications` (
    `publicationId` CHAR(36) NOT NULL,
    `researchProjectId` CHAR(36) NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `authors` TEXT NOT NULL,
    `journal` VARCHAR(300) NULL,
    `year` INTEGER NULL,
    `doi` VARCHAR(100) NULL,
    `filePath` VARCHAR(500) NULL,
    `citation` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `publications_researchProjectId_idx`(`researchProjectId`),
    PRIMARY KEY (`publicationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `notificationId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NULL,
    `beneficiaryId` CHAR(36) NULL,
    `channel` ENUM('IN_APP', 'EMAIL', 'SMS') NOT NULL,
    `templateId` CHAR(36) NULL,
    `subject` VARCHAR(300) NULL,
    `body` TEXT NOT NULL,
    `language` VARCHAR(10) NOT NULL DEFAULT 'en',
    `status` ENUM('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'READ') NOT NULL DEFAULT 'PENDING',
    `sentAt` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `readAt` DATETIME(3) NULL,
    `error` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_userId_idx`(`userId`),
    INDEX `notifications_status_idx`(`status`),
    INDEX `notifications_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`notificationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_templates` (
    `templateId` CHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `channel` ENUM('IN_APP', 'EMAIL', 'SMS') NOT NULL,
    `subject` VARCHAR(300) NULL,
    `body` TEXT NOT NULL,
    `language` VARCHAR(10) NOT NULL,
    `description` TEXT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `orgId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `notification_templates_code_key`(`code`),
    PRIMARY KEY (`templateId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sync_jobs` (
    `jobId` CHAR(36) NOT NULL,
    `integrationCode` VARCHAR(30) NOT NULL,
    `direction` ENUM('INBOUND', 'OUTBOUND', 'BIDIRECTIONAL') NOT NULL,
    `kind` VARCHAR(50) NOT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `durationMs` INTEGER NULL,
    `status` ENUM('RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED') NOT NULL DEFAULT 'RUNNING',
    `recordsProcessed` INTEGER NOT NULL DEFAULT 0,
    `recordsFailed` INTEGER NOT NULL DEFAULT 0,
    `errorSummary` TEXT NULL,
    `triggeredById` CHAR(36) NULL,

    INDEX `sync_jobs_integrationCode_idx`(`integrationCode`),
    INDEX `sync_jobs_status_idx`(`status`),
    INDEX `sync_jobs_startedAt_idx`(`startedAt`),
    PRIMARY KEY (`jobId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `master_data` (
    `masterId` CHAR(36) NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `nameAm` VARCHAR(200) NULL,
    `parentId` CHAR(36) NULL,
    `attributes` JSON NULL,
    `orderNo` INTEGER NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdById` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `master_data_category_idx`(`category`),
    UNIQUE INDEX `master_data_category_code_key`(`category`, `code`),
    PRIMARY KEY (`masterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_settings` (
    `settingId` CHAR(36) NOT NULL,
    `key` VARCHAR(100) NOT NULL,
    `value` JSON NOT NULL,
    `category` VARCHAR(50) NULL,
    `description` TEXT NULL,
    `isSecret` BOOLEAN NOT NULL DEFAULT false,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `system_settings_key_key`(`key`),
    PRIMARY KEY (`settingId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cost_per_output_rows` (
    `rowId` CHAR(36) NOT NULL,
    `indicatorId` CHAR(36) NOT NULL,
    `expendedEtb` DECIMAL(18, 2) NOT NULL,
    `costPerUnit` DECIMAL(18, 2) NOT NULL,
    `computedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `cost_per_output_rows_indicatorId_key`(`indicatorId`),
    PRIMARY KEY (`rowId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `organizations` ADD CONSTRAINT `organizations_parentOrgId_fkey` FOREIGN KEY (`parentOrgId`) REFERENCES `organizations`(`orgId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_orgId_fkey` FOREIGN KEY (`orgId`) REFERENCES `organizations`(`orgId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`roleId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_ownerOrgId_fkey` FOREIGN KEY (`ownerOrgId`) REFERENCES `organizations`(`orgId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`locationId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `components` ADD CONSTRAINT `components_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`projectId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `components` ADD CONSTRAINT `components_responsibleOrgId_fkey` FOREIGN KEY (`responsibleOrgId`) REFERENCES `organizations`(`orgId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subcomponents` ADD CONSTRAINT `subcomponents_componentId_fkey` FOREIGN KEY (`componentId`) REFERENCES `components`(`componentId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subcomponents` ADD CONSTRAINT `subcomponents_responsibleOrgId_fkey` FOREIGN KEY (`responsibleOrgId`) REFERENCES `organizations`(`orgId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subcomponents` ADD CONSTRAINT `subcomponents_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`projectId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `milestones` ADD CONSTRAINT `milestones_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`projectId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `milestones` ADD CONSTRAINT `milestones_componentId_fkey` FOREIGN KEY (`componentId`) REFERENCES `components`(`componentId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `milestones` ADD CONSTRAINT `milestones_ownerOrgId_fkey` FOREIGN KEY (`ownerOrgId`) REFERENCES `organizations`(`orgId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `indicators` ADD CONSTRAINT `indicators_subcomponentId_fkey` FOREIGN KEY (`subcomponentId`) REFERENCES `subcomponents`(`subcomponentId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `indicators` ADD CONSTRAINT `indicators_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`projectId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `indicator_values` ADD CONSTRAINT `indicator_values_indicatorId_fkey` FOREIGN KEY (`indicatorId`) REFERENCES `indicators`(`indicatorId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `indicator_values` ADD CONSTRAINT `indicator_values_verifiedById_fkey` FOREIGN KEY (`verifiedById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budgets` ADD CONSTRAINT `budgets_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`projectId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budgets` ADD CONSTRAINT `budgets_componentId_fkey` FOREIGN KEY (`componentId`) REFERENCES `components`(`componentId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `disbursements` ADD CONSTRAINT `disbursements_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`projectId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `disbursements` ADD CONSTRAINT `disbursements_sourceOrgId_fkey` FOREIGN KEY (`sourceOrgId`) REFERENCES `organizations`(`orgId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `procurement` ADD CONSTRAINT `procurement_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`projectId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `procurement` ADD CONSTRAINT `procurement_componentId_fkey` FOREIGN KEY (`componentId`) REFERENCES `components`(`componentId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `suppliers` ADD CONSTRAINT `suppliers_orgId_fkey` FOREIGN KEY (`orgId`) REFERENCES `organizations`(`orgId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`supplierId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`projectId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_procurementId_fkey` FOREIGN KEY (`procurementId`) REFERENCES `procurement`(`procurementId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`supplierId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `beneficiaries` ADD CONSTRAINT `beneficiaries_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`locationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `beneficiaries` ADD CONSTRAINT `beneficiaries_verifiedById_fkey` FOREIGN KEY (`verifiedById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_deliveries` ADD CONSTRAINT `service_deliveries_beneficiaryId_fkey` FOREIGN KEY (`beneficiaryId`) REFERENCES `beneficiaries`(`beneficiaryId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_deliveries` ADD CONSTRAINT `service_deliveries_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`projectId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_deliveries` ADD CONSTRAINT `service_deliveries_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`supplierId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_deliveries` ADD CONSTRAINT `service_deliveries_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`productId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_deliveries` ADD CONSTRAINT `service_deliveries_verifiedById_fkey` FOREIGN KEY (`verifiedById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grievances` ADD CONSTRAINT `grievances_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`projectId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grievances` ADD CONSTRAINT `grievances_beneficiaryId_fkey` FOREIGN KEY (`beneficiaryId`) REFERENCES `beneficiaries`(`beneficiaryId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grievances` ADD CONSTRAINT `grievances_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`locationId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grievances` ADD CONSTRAINT `grievances_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grievances` ADD CONSTRAINT `grievances_escalatedToId_fkey` FOREIGN KEY (`escalatedToId`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grievance_actions` ADD CONSTRAINT `grievance_actions_grievanceId_fkey` FOREIGN KEY (`grievanceId`) REFERENCES `grievances`(`grievanceId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grievance_actions` ADD CONSTRAINT `grievance_actions_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `users`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`projectId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `users`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_versions` ADD CONSTRAINT `document_versions_docId_fkey` FOREIGN KEY (`docId`) REFERENCES `documents`(`docId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_versions` ADD CONSTRAINT `document_versions_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `users`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inception_reports` ADD CONSTRAINT `inception_reports_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`projectId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inception_reports` ADD CONSTRAINT `inception_reports_submittedById_fkey` FOREIGN KEY (`submittedById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inception_reports` ADD CONSTRAINT `inception_reports_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_comments` ADD CONSTRAINT `review_comments_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `inception_reports`(`reportId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_comments` ADD CONSTRAINT `review_comments_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_comments` ADD CONSTRAINT `review_comments_resolvedById_fkey` FOREIGN KEY (`resolvedById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`projectId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_generatedById_fkey` FOREIGN KEY (`generatedById`) REFERENCES `users`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `impact_indicators` ADD CONSTRAINT `impact_indicators_domainId_fkey` FOREIGN KEY (`domainId`) REFERENCES `impact_domains`(`domainId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `impact_indicators` ADD CONSTRAINT `impact_indicators_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `indicator_waves` ADD CONSTRAINT `indicator_waves_indicatorId_fkey` FOREIGN KEY (`indicatorId`) REFERENCES `impact_indicators`(`indicatorId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `indicator_waves` ADD CONSTRAINT `indicator_waves_waveId_fkey` FOREIGN KEY (`waveId`) REFERENCES `waves`(`waveId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `theory_of_change` ADD CONSTRAINT `theory_of_change_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`projectId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `theory_of_change` ADD CONSTRAINT `theory_of_change_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `surveys` ADD CONSTRAINT `surveys_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `survey_versions` ADD CONSTRAINT `survey_versions_surveyId_fkey` FOREIGN KEY (`surveyId`) REFERENCES `surveys`(`surveyId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `survey_versions` ADD CONSTRAINT `survey_versions_publishedById_fkey` FOREIGN KEY (`publishedById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sections` ADD CONSTRAINT `sections_versionId_fkey` FOREIGN KEY (`versionId`) REFERENCES `survey_versions`(`versionId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `sections`(`sectionId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_indicatorId_fkey` FOREIGN KEY (`indicatorId`) REFERENCES `impact_indicators`(`indicatorId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_options` ADD CONSTRAINT `question_options_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `questions`(`questionId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `skip_logic` ADD CONSTRAINT `skip_logic_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `questions`(`questionId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `skip_logic` ADD CONSTRAINT `skip_logic_targetQuestionId_fkey` FOREIGN KEY (`targetQuestionId`) REFERENCES `questions`(`questionId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `waves` ADD CONSTRAINT `waves_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`projectId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_waveId_fkey` FOREIGN KEY (`waveId`) REFERENCES `waves`(`waveId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_surveyVersionId_fkey` FOREIGN KEY (`surveyVersionId`) REFERENCES `survey_versions`(`versionId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_collectorId_fkey` FOREIGN KEY (`collectorId`) REFERENCES `collectors`(`collectorId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_supervisorId_fkey` FOREIGN KEY (`supervisorId`) REFERENCES `supervisors`(`supervisorId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `collectors` ADD CONSTRAINT `collectors_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supervisors` ADD CONSTRAINT `supervisors_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `assignments`(`assignmentId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_collectorId_fkey` FOREIGN KEY (`collectorId`) REFERENCES `collectors`(`collectorId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_panelId_fkey` FOREIGN KEY (`panelId`) REFERENCES `panel_members`(`panelId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_waveId_fkey` FOREIGN KEY (`waveId`) REFERENCES `waves`(`waveId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_surveyVersionId_fkey` FOREIGN KEY (`surveyVersionId`) REFERENCES `survey_versions`(`versionId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`projectId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submission_answers` ADD CONSTRAINT `submission_answers_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `submissions`(`submissionId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submission_answers` ADD CONSTRAINT `submission_answers_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `questions`(`questionId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paradata` ADD CONSTRAINT `paradata_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `submissions`(`submissionId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paradata` ADD CONSTRAINT `paradata_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `questions`(`questionId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media_attachments` ADD CONSTRAINT `media_attachments_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `submissions`(`submissionId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consents` ADD CONSTRAINT `consents_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `submissions`(`submissionId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consents` ADD CONSTRAINT `consents_beneficiaryId_fkey` FOREIGN KEY (`beneficiaryId`) REFERENCES `beneficiaries`(`beneficiaryId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qa_flags` ADD CONSTRAINT `qa_flags_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `submissions`(`submissionId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qa_flags` ADD CONSTRAINT `qa_flags_ruleId_fkey` FOREIGN KEY (`ruleId`) REFERENCES `qa_rules`(`ruleId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qa_flags` ADD CONSTRAINT `qa_flags_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `back_checks` ADD CONSTRAINT `back_checks_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `submissions`(`submissionId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `back_checks` ADD CONSTRAINT `back_checks_supervisorId_fkey` FOREIGN KEY (`supervisorId`) REFERENCES `supervisors`(`supervisorId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `collector_scorecards` ADD CONSTRAINT `collector_scorecards_collectorId_fkey` FOREIGN KEY (`collectorId`) REFERENCES `collectors`(`collectorId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `collector_scorecards` ADD CONSTRAINT `collector_scorecards_waveId_fkey` FOREIGN KEY (`waveId`) REFERENCES `waves`(`waveId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `collector_scorecards` ADD CONSTRAINT `collector_scorecards_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`projectId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `treatment_groups` ADD CONSTRAINT `treatment_groups_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`projectId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `treatment_groups` ADD CONSTRAINT `treatment_groups_waveId_fkey` FOREIGN KEY (`waveId`) REFERENCES `waves`(`waveId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `panel_members` ADD CONSTRAINT `panel_members_treatmentGroupId_fkey` FOREIGN KEY (`treatmentGroupId`) REFERENCES `treatment_groups`(`groupId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `panel_members` ADD CONSTRAINT `panel_members_beneficiaryId_fkey` FOREIGN KEY (`beneficiaryId`) REFERENCES `beneficiaries`(`beneficiaryId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `panel_members` ADD CONSTRAINT `panel_members_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`projectId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `panel_members` ADD CONSTRAINT `panel_members_enrolledWaveId_fkey` FOREIGN KEY (`enrolledWaveId`) REFERENCES `waves`(`waveId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wave_datasets` ADD CONSTRAINT `wave_datasets_waveId_fkey` FOREIGN KEY (`waveId`) REFERENCES `waves`(`waveId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `research_datasets` ADD CONSTRAINT `research_datasets_waveId_fkey` FOREIGN KEY (`waveId`) REFERENCES `waves`(`waveId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `research_datasets` ADD CONSTRAINT `research_datasets_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`projectId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `data_requests` ADD CONSTRAINT `data_requests_datasetId_fkey` FOREIGN KEY (`datasetId`) REFERENCES `research_datasets`(`datasetId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `data_requests` ADD CONSTRAINT `data_requests_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `data_requests` ADD CONSTRAINT `data_requests_requesterId_fkey` FOREIGN KEY (`requesterId`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `data_use_agreements` ADD CONSTRAINT `data_use_agreements_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `data_requests`(`requestId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `research_projects` ADD CONSTRAINT `research_projects_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`projectId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `research_projects` ADD CONSTRAINT `research_projects_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `publications` ADD CONSTRAINT `publications_researchProjectId_fkey` FOREIGN KEY (`researchProjectId`) REFERENCES `research_projects`(`researchProjectId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `notification_templates`(`templateId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_templates` ADD CONSTRAINT `notification_templates_orgId_fkey` FOREIGN KEY (`orgId`) REFERENCES `organizations`(`orgId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sync_jobs` ADD CONSTRAINT `sync_jobs_triggeredById_fkey` FOREIGN KEY (`triggeredById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `master_data` ADD CONSTRAINT `master_data_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cost_per_output_rows` ADD CONSTRAINT `cost_per_output_rows_indicatorId_fkey` FOREIGN KEY (`indicatorId`) REFERENCES `indicators`(`indicatorId`) ON DELETE CASCADE ON UPDATE CASCADE;
