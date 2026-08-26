-- 每位家庭成员对同一条成长记录最多送一朵小花。
CREATE TABLE `growth_record_flowers` (
    `id` CHAR(26) NOT NULL,
    `growth_record_id` CHAR(26) NOT NULL,
    `user_id` CHAR(26) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `growth_record_flowers_growth_record_id_user_id_key`(`growth_record_id`, `user_id`),
    INDEX `growth_record_flowers_user_id_created_at_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `growth_record_flowers`
    ADD CONSTRAINT `growth_record_flowers_growth_record_id_fkey`
    FOREIGN KEY (`growth_record_id`) REFERENCES `growth_records`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `growth_record_flowers_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
