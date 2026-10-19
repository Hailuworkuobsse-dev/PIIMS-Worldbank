ALTER TABLE `users`
  ADD COLUMN `acceptedPolicyVersion` VARCHAR(40) NULL,
  ADD COLUMN `acceptedPolicyAt` DATETIME(3) NULL;
