ALTER TABLE `media_assets`
  MODIFY `category` ENUM('IMAGE', 'USER_AVATAR', 'BABY_AVATAR') NOT NULL DEFAULT 'IMAGE';

ALTER TABLE `users`
  ADD COLUMN `avatar_asset_id` CHAR(26) NULL,
  ADD UNIQUE INDEX `users_avatar_asset_id_key` (`avatar_asset_id`),
  ADD CONSTRAINT `users_avatar_asset_id_fkey`
    FOREIGN KEY (`avatar_asset_id`) REFERENCES `media_assets`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `babies`
  ADD COLUMN `avatar_asset_id` CHAR(26) NULL,
  ADD UNIQUE INDEX `babies_avatar_asset_id_key` (`avatar_asset_id`),
  ADD CONSTRAINT `babies_avatar_asset_id_fkey`
    FOREIGN KEY (`avatar_asset_id`) REFERENCES `media_assets`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
