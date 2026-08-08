-- CreateTable
CREATE TABLE `family_invites` (
    `id` CHAR(26) NOT NULL,
    `family_id` CHAR(26) NOT NULL,
    `created_by_user_id` CHAR(26) NOT NULL,
    `code_hash` CHAR(64) NOT NULL,
    `status` ENUM('ACTIVE', 'REVOKED') NOT NULL DEFAULT 'ACTIVE',
    `use_count` INTEGER NOT NULL DEFAULT 0,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `family_invites_code_hash_key`(`code_hash`),
    INDEX `family_invites_family_id_status_expires_at_idx`(`family_id`, `status`, `expires_at`),
    INDEX `family_invites_created_by_user_id_created_at_idx`(`created_by_user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `family_invites` ADD CONSTRAINT `family_invites_family_id_fkey` FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `family_invites` ADD CONSTRAINT `family_invites_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
