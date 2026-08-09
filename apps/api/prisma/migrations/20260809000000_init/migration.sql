-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(26) NOT NULL,
    `nickname` VARCHAR(64) NULL,
    `avatar_url` VARCHAR(512) NULL,
    `status` ENUM('ACTIVE', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `users_status_created_at_idx`(`status`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_identities` (
    `id` CHAR(26) NOT NULL,
    `user_id` CHAR(26) NOT NULL,
    `provider` ENUM('WECHAT_MINI_PROGRAM') NOT NULL,
    `app_id` VARCHAR(64) NOT NULL,
    `subject` VARCHAR(128) NOT NULL,
    `union_id` VARCHAR(128) NULL,
    `last_login_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `user_identities_user_id_idx`(`user_id`),
    INDEX `user_identities_provider_union_id_idx`(`provider`, `union_id`),
    UNIQUE INDEX `user_identities_provider_app_id_subject_key`(`provider`, `app_id`, `subject`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auth_sessions` (
    `id` CHAR(26) NOT NULL,
    `user_id` CHAR(26) NOT NULL,
    `device_id` VARCHAR(128) NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `last_used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `auth_sessions_user_id_revoked_at_expires_at_idx`(`user_id`, `revoked_at`, `expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auth_refresh_tokens` (
    `id` CHAR(26) NOT NULL,
    `session_id` CHAR(26) NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `status` ENUM('ACTIVE', 'ROTATED', 'REVOKED') NOT NULL DEFAULT 'ACTIVE',
    `replaced_by_token_id` CHAR(26) NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `auth_refresh_tokens_replaced_by_token_id_key`(`replaced_by_token_id`),
    INDEX `auth_refresh_tokens_session_id_status_expires_at_idx`(`session_id`, `status`, `expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `idempotency_keys` (
    `id` CHAR(26) NOT NULL,
    `user_id` CHAR(26) NOT NULL,
    `scope` VARCHAR(64) NOT NULL,
    `idempotency_key` VARCHAR(128) NOT NULL,
    `request_hash` CHAR(64) NOT NULL,
    `status` ENUM('PROCESSING', 'SUCCEEDED', 'FAILED') NOT NULL DEFAULT 'PROCESSING',
    `response_status` INTEGER NULL,
    `response_json` JSON NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idempotency_keys_expires_at_idx`(`expires_at`),
    UNIQUE INDEX `idempotency_keys_user_id_scope_idempotency_key_key`(`user_id`, `scope`, `idempotency_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `families` (
    `id` CHAR(26) NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    `owner_user_id` CHAR(26) NOT NULL,
    `status` ENUM('ACTIVE', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `families_owner_user_id_status_idx`(`owner_user_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `family_members` (
    `id` CHAR(26) NOT NULL,
    `family_id` CHAR(26) NOT NULL,
    `user_id` CHAR(26) NOT NULL,
    `role` ENUM('ADMIN', 'PARENT', 'RELATIVE') NOT NULL,
    `status` ENUM('ACTIVE', 'REMOVED') NOT NULL DEFAULT 'ACTIVE',
    `joined_at` DATETIME(3) NOT NULL,
    `removed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `family_members_user_id_status_idx`(`user_id`, `status`),
    INDEX `family_members_family_id_status_role_idx`(`family_id`, `status`, `role`),
    UNIQUE INDEX `family_members_family_id_user_id_key`(`family_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- CreateTable
CREATE TABLE `babies` (
    `id` CHAR(26) NOT NULL,
    `family_id` CHAR(26) NOT NULL,
    `nickname` VARCHAR(64) NOT NULL,
    `birth_date` DATE NOT NULL,
    `birth_time` TIME(0) NULL,
    `timezone` VARCHAR(64) NOT NULL DEFAULT 'Asia/Shanghai',
    `gender` ENUM('MALE', 'FEMALE', 'UNSPECIFIED') NOT NULL DEFAULT 'UNSPECIFIED',
    `introduction` TEXT NULL,
    `status` ENUM('ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `version` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `babies_family_id_status_idx`(`family_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `growth_records` (
    `id` CHAR(26) NOT NULL,
    `family_id` CHAR(26) NOT NULL,
    `baby_id` CHAR(26) NOT NULL,
    `creator_user_id` CHAR(26) NOT NULL,
    `type` ENUM('DAILY', 'FIRST', 'FAMILY', 'OTHER') NOT NULL,
    `content` TEXT NOT NULL,
    `occurred_at` DATETIME(3) NOT NULL,
    `status` ENUM('ACTIVE', 'DELETED') NOT NULL DEFAULT 'ACTIVE',
    `client_request_id` VARCHAR(128) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `growth_records_baby_id_status_occurred_at_id_idx`(`baby_id`, `status`, `occurred_at`, `id`),
    INDEX `growth_records_family_id_status_updated_at_idx`(`family_id`, `status`, `updated_at`),
    UNIQUE INDEX `growth_records_creator_user_id_client_request_id_key`(`creator_user_id`, `client_request_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media_assets` (
    `id` CHAR(26) NOT NULL,
    `family_id` CHAR(26) NOT NULL,
    `baby_id` CHAR(26) NOT NULL,
    `uploader_user_id` CHAR(26) NOT NULL,
    `category` ENUM('IMAGE') NOT NULL DEFAULT 'IMAGE',
    `object_key` VARCHAR(512) NOT NULL,
    `mime_type` VARCHAR(128) NOT NULL,
    `size_bytes` BIGINT UNSIGNED NOT NULL,
    `sha256` CHAR(64) NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `duration_ms` INTEGER NULL,
    `status` ENUM('PENDING', 'UPLOADED', 'READY', 'FAILED', 'DELETED') NOT NULL DEFAULT 'PENDING',
    `uploaded_at` DATETIME(3) NULL,
    `intent_expires_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `media_assets_object_key_key`(`object_key`),
    INDEX `media_assets_family_id_status_created_at_idx`(`family_id`, `status`, `created_at`),
    INDEX `media_assets_uploader_user_id_status_idx`(`uploader_user_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `growth_record_assets` (
    `growth_record_id` CHAR(26) NOT NULL,
    `media_asset_id` CHAR(26) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `growth_record_assets_media_asset_id_key`(`media_asset_id`),
    INDEX `growth_record_assets_growth_record_id_sort_order_idx`(`growth_record_id`, `sort_order`),
    PRIMARY KEY (`growth_record_id`, `media_asset_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` CHAR(26) NOT NULL,
    `family_id` CHAR(26) NOT NULL,
    `operator_user_id` CHAR(26) NOT NULL,
    `action` VARCHAR(64) NOT NULL,
    `target_type` VARCHAR(64) NOT NULL,
    `target_id` CHAR(26) NOT NULL,
    `result` ENUM('SUCCEEDED', 'FAILED') NOT NULL,
    `request_id` VARCHAR(64) NOT NULL,
    `metadata_json` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_family_id_created_at_idx`(`family_id`, `created_at`),
    INDEX `audit_logs_target_type_target_id_created_at_idx`(`target_type`, `target_id`, `created_at`),
    INDEX `audit_logs_request_id_idx`(`request_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_identities` ADD CONSTRAINT `user_identities_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auth_sessions` ADD CONSTRAINT `auth_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auth_refresh_tokens` ADD CONSTRAINT `auth_refresh_tokens_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `auth_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auth_refresh_tokens` ADD CONSTRAINT `auth_refresh_tokens_replaced_by_token_id_fkey` FOREIGN KEY (`replaced_by_token_id`) REFERENCES `auth_refresh_tokens`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `idempotency_keys` ADD CONSTRAINT `idempotency_keys_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `families` ADD CONSTRAINT `families_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `family_members` ADD CONSTRAINT `family_members_family_id_fkey` FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `family_members` ADD CONSTRAINT `family_members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `family_invites` ADD CONSTRAINT `family_invites_family_id_fkey` FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `family_invites` ADD CONSTRAINT `family_invites_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `babies` ADD CONSTRAINT `babies_family_id_fkey` FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `growth_records` ADD CONSTRAINT `growth_records_family_id_fkey` FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `growth_records` ADD CONSTRAINT `growth_records_baby_id_fkey` FOREIGN KEY (`baby_id`) REFERENCES `babies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `growth_records` ADD CONSTRAINT `growth_records_creator_user_id_fkey` FOREIGN KEY (`creator_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media_assets` ADD CONSTRAINT `media_assets_family_id_fkey` FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media_assets` ADD CONSTRAINT `media_assets_baby_id_fkey` FOREIGN KEY (`baby_id`) REFERENCES `babies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media_assets` ADD CONSTRAINT `media_assets_uploader_user_id_fkey` FOREIGN KEY (`uploader_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `growth_record_assets` ADD CONSTRAINT `growth_record_assets_growth_record_id_fkey` FOREIGN KEY (`growth_record_id`) REFERENCES `growth_records`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `growth_record_assets` ADD CONSTRAINT `growth_record_assets_media_asset_id_fkey` FOREIGN KEY (`media_asset_id`) REFERENCES `media_assets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_family_id_fkey` FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_operator_user_id_fkey` FOREIGN KEY (`operator_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;


