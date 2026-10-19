ALTER TABLE `refresh_tokens`
  ADD COLUMN `mfaVerified` BOOLEAN NOT NULL DEFAULT FALSE;

-- Existing refresh sessions predate persisted MFA assurance; require re-authentication.
UPDATE `refresh_tokens`
SET `revokedAt` = CURRENT_TIMESTAMP(3)
WHERE `revokedAt` IS NULL;
